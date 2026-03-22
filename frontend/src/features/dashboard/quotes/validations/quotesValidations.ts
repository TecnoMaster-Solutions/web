import type { QuoteDetailPayload } from "../types/Quote.type";

export const QUOTE_OBSERVATION_MAX = 500;

type ServiceLineItemInput = { nombre: string; precio: number; tipoId: number };
type ServiceOptionInput = { name: string; typeofserviceid?: number };
type ProductOptionInput = { productid: number; productname: string };
type ClientDraftInput = {
  documento: string;
  nombre: string;
  telefono: string;
  correo: string;
};

export type QuoteFormErrors = Partial<{
  client: string;
  serviceType: string;
  viaticos: string;
  servicios: string;
  materiales: string;
  observation: string;
}>;

export type QuoteValidationContext = {
  hasServiceRequest: boolean;
  createClientInlineEnabled: boolean;
  clientDraft: ClientDraftInput;
  servicetype: string;
  viaticosValue: number;
  observation: string;
  serviceLines: ServiceLineItemInput[];
  servicesCatalog: ServiceOptionInput[];
  details: QuoteDetailPayload[];
  productsCatalog: ProductOptionInput[];
};

const normalizeText = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function validateObservation(observation: string): string | undefined {
  const text = String(observation || "").trim();
  if (!text) return undefined;
  if (text.length > QUOTE_OBSERVATION_MAX) {
    return `La observacion no puede superar ${QUOTE_OBSERVATION_MAX} caracteres.`;
  }
  return undefined;
}

function validateClient(ctx: QuoteValidationContext): string | undefined {
  if (ctx.hasServiceRequest) return undefined;
  if (!ctx.createClientInlineEnabled) {
    return "Debes asociar una solicitud o crear un cliente para la cotizacion.";
  }

  const { documento, nombre, telefono, correo } = ctx.clientDraft;
  if (!String(documento || "").trim()) return "El documento del cliente es obligatorio.";
  if (!String(nombre || "").trim()) return "El nombre del cliente es obligatorio.";
  if (!String(telefono || "").trim()) return "El telefono del cliente es obligatorio.";

  const email = String(correo || "").trim();
  if (!email) return "El correo del cliente es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "El correo del cliente no es valido.";

  return undefined;
}

function collectServiceErrors(
  serviceLines: ServiceLineItemInput[],
  servicesCatalog: ServiceOptionInput[],
  collectAll: boolean,
): string | undefined {
  const errors: string[] = [];

  if (!serviceLines.length) errors.push("Debes anadir al menos un servicio.");

  const invalid = serviceLines.some((line) => {
    if (!Number.isFinite(Number(line.tipoId)) || Number(line.tipoId) <= 0) return true;
    if (!String(line.nombre || "").trim()) return true;
    return !servicesCatalog.some(
      (service) =>
        normalizeText(service.name) === normalizeText(line.nombre) &&
        Number(service.typeofserviceid) === Number(line.tipoId),
    );
  });
  if (invalid) errors.push("Hay servicios invalidos. Vuelve a seleccionarlos.");

  const badPrice = serviceLines.some(
    (line) => !Number.isFinite(Number(line.precio)) || Number(line.precio) < 0,
  );
  if (badPrice) errors.push("Corrige precios de servicios.");

  const duplicate = (() => {
    const seen = new Set<string>();
    for (const line of serviceLines) {
      const key = `${Number(line.tipoId)}::${normalizeText(line.nombre)}`;
      if (key.endsWith("::")) continue;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  })();
  if (duplicate) errors.push("No puedes repetir el mismo servicio dentro del mismo tipo.");

  if (!errors.length) return undefined;
  return collectAll ? errors.join(" ") : errors[0];
}

function collectMaterialErrors(
  details: QuoteDetailPayload[],
  productsCatalog: ProductOptionInput[],
  collectAll: boolean,
): string | undefined {
  const errors: string[] = [];

  if (!productsCatalog.length) errors.push("No hay productos cargados desde la BD.");
  if (!details.length) errors.push("Debes anadir al menos un producto.");

  const duplicate =
    details.length > 1 &&
    new Set(details.map((detail) => Number(detail.productid || 0))).size !== details.length;
  if (duplicate) errors.push("No puedes repetir el mismo producto.");

  if (
    details.some(
      (detail) =>
        !Number.isFinite(Number(detail.productid)) ||
        Number(detail.productid) <= 0 ||
        !productsCatalog.some((product) => product.productid === Number(detail.productid)),
    )
  ) {
    errors.push("Hay productos invalidos. Vuelve a seleccionarlos.");
  }

  if (
    details.some(
      (detail) =>
        !Number.isFinite(Number(detail.quantity)) || Number(detail.quantity) < 1,
    )
  ) {
    errors.push("Corrige cantidades de productos (minimo 1).");
  }

  if (!errors.length) return undefined;
  return collectAll ? errors.join(" ") : errors[0];
}

export function validateQuoteField(
  key: keyof QuoteFormErrors,
  ctx: QuoteValidationContext,
): string | undefined {
  if (key === "client") return validateClient(ctx);

  if (key === "serviceType") {
    return String(ctx.servicetype || "").trim()
      ? undefined
      : "Selecciona el tipo de servicio.";
  }

  if (key === "viaticos") {
    if (!Number.isFinite(ctx.viaticosValue)) return "Viaticos debe ser un numero valido.";
    if (ctx.viaticosValue < 0) return "Viaticos no puede ser negativo.";
    return undefined;
  }

  if (key === "servicios") {
    return collectServiceErrors(ctx.serviceLines, ctx.servicesCatalog, false);
  }

  if (key === "materiales") {
    return collectMaterialErrors(ctx.details, ctx.productsCatalog, false);
  }

  if (key === "observation") {
    return validateObservation(ctx.observation);
  }

  return undefined;
}

export function validateQuoteForm(ctx: QuoteValidationContext): QuoteFormErrors {
  const errors: QuoteFormErrors = {};

  const clientError = validateClient(ctx);
  if (clientError) errors.client = clientError;

  if (!String(ctx.servicetype || "").trim()) {
    errors.serviceType = "Selecciona el tipo de servicio.";
  }

  if (!Number.isFinite(ctx.viaticosValue)) {
    errors.viaticos = "Viaticos debe ser un numero valido.";
  } else if (ctx.viaticosValue < 0) {
    errors.viaticos = "Viaticos no puede ser negativo.";
  }

  const serviceError = collectServiceErrors(ctx.serviceLines, ctx.servicesCatalog, true);
  if (serviceError) errors.servicios = serviceError;

  const materialsError = collectMaterialErrors(ctx.details, ctx.productsCatalog, true);
  if (materialsError) errors.materiales = materialsError;

  const observationError = validateObservation(ctx.observation);
  if (observationError) errors.observation = observationError;

  return errors;
}
