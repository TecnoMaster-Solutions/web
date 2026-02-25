import { isAllowedDate, isAllowedTime, parseYMD, timeToMinutes } from "./CreateOrderService.utils";

export const DESC_MIN = 5;
export const DESC_MAX = 500;

export type OrderServiceFormErrors = Partial<{
  quote: string;
  clientId: string;
  direccion: string;
  tipo: string;
  schedule: string;
  technicians: string;
  viaticos: string;
  servicios: string;
  materiales: string;
  description: string;
}>;

type ServiceLineItemInput = { nombre: string; precio: number; tipoId: number };
type MaterialLineItemInput = { nombre: string; cantidad: number };
type ServiceOptionInput = { name: string; typeofserviceid: number };
type ProductOptionInput = { productname: string };

type ValidationContext = {
  clientId: number | string;
  tipoId: number | null;
  dateStart: string;
  timeStart: string;
  dateEnd: string;
  timeEnd: string;
  selectedTechnicians: number[];
  viaticosValue: number;
  direccion: string;
  descripcion: string;
  servicios: ServiceLineItemInput[];
  servicesCatalog: ServiceOptionInput[];
  materiales: MaterialLineItemInput[];
  productsCatalog: ProductOptionInput[];
};

export function validateDescription(description: string): string | undefined {
  const text = String(description || "").trim();
  if (!text) return undefined;
  if (text.length > DESC_MAX) return `La descripcion no puede superar ${DESC_MAX} caracteres.`;
  return undefined;
}

function validateDireccion(direccion: string): string | undefined {
  const text = String(direccion || "").trim();
  if (!text) return "La direccion es obligatoria.";
  if (text.length < 3) return "La direccion debe tener al menos 3 caracteres.";
  if (text.length > 255) return "La direccion no puede superar 255 caracteres.";
  return undefined;
}

function validateScheduleOnly(ctx: Pick<ValidationContext, "dateStart" | "timeStart" | "dateEnd" | "timeEnd">): string | undefined {
  const { dateStart, timeStart, dateEnd, timeEnd } = ctx;

  if (!dateStart || !timeStart || !dateEnd || !timeEnd) return "Completa fecha y hora de inicio y fin.";
  if (!isAllowedDate(dateStart) || !isAllowedDate(dateEnd)) return "Solo se permite agendar de lunes a sabado.";
  if (!isAllowedTime(timeStart) || !isAllowedTime(timeEnd)) return "Horario permitido: 07:00-17:00.";

  const sDate = parseYMD(dateStart);
  const eDate = parseYMD(dateEnd);
  if (!sDate || !eDate) return "Fecha invalida.";

  const s = new Date(sDate);
  const e = new Date(eDate);
  const sMin = timeToMinutes(timeStart);
  const eMin = timeToMinutes(timeEnd);
  if (!Number.isFinite(sMin) || !Number.isFinite(eMin)) return "Hora invalida.";

  s.setHours(Math.floor(sMin / 60), sMin % 60, 0, 0);
  e.setHours(Math.floor(eMin / 60), eMin % 60, 0, 0);

  if (!(e.getTime() > s.getTime())) return "La fecha/hora fin debe ser mayor que la de inicio.";
  if (timeStart === "17:00") return "La hora de inicio no puede ser 17:00.";

  return undefined;
}

function collectServiceErrors(
  servicios: ServiceLineItemInput[],
  servicesCatalog: ServiceOptionInput[],
  collectAll: boolean
): string | undefined {
  const errors: string[] = [];

  if (servicios.length === 0) return "Debes anadir al menos un servicio.";

  const invalidSvc = servicios.some((s) => {
    if (!s.tipoId) return true;
    return !servicesCatalog.some((x) => x.name === s.nombre && x.typeofserviceid === s.tipoId);
  });
  if (invalidSvc) errors.push("Hay servicios invalidos. Vuelve a seleccionarlos.");

  const badPriceSvc = servicios.some((s) => !Number.isFinite(Number(s.precio)) || Number(s.precio) < 0);
  if (badPriceSvc) errors.push("Corrige precios de servicios.");

  const dupByType = (() => {
    const map = new Map<number, Set<string>>();
    for (const s of servicios) {
      const name = String(s.nombre || "").trim();
      if (!name) continue;
      const set = map.get(s.tipoId) ?? new Set<string>();
      if (set.has(name)) return true;
      set.add(name);
      map.set(s.tipoId, set);
    }
    return false;
  })();
  if (dupByType) errors.push("No puedes repetir el mismo servicio dentro del mismo tipo.");

  if (!errors.length) return undefined;
  return collectAll ? errors.join(" ") : errors[0];
}

function collectMaterialErrors(
  materiales: MaterialLineItemInput[],
  productsCatalog: ProductOptionInput[],
  collectAll: boolean
): string | undefined {
  const errors: string[] = [];

  if (!productsCatalog.length) errors.push("No hay productos cargados desde la BD.");
  if (!materiales.length) errors.push("Debes anadir al menos un producto (material).");

  const dupMat =
    materiales.length > 1 && new Set(materiales.map((m) => String(m.nombre || "").trim())).size !== materiales.length;
  if (dupMat) errors.push("No puedes repetir el mismo producto.");

  if (materiales.some((m) => !productsCatalog.some((p) => p.productname === m.nombre))) {
    errors.push("Hay productos invalidos. Vuelve a seleccionarlos.");
  }

  if (materiales.some((m) => !Number.isFinite(Number(m.cantidad)) || Number(m.cantidad) < 1)) {
    errors.push("Corrige cantidades (minimo 1).");
  }

  if (!errors.length) return undefined;
  return collectAll ? errors.join(" ") : errors[0];
}

export function validateField(key: keyof OrderServiceFormErrors, ctx: ValidationContext): string | undefined {
  if (key === "clientId") return !ctx.clientId ? "Selecciona un cliente." : undefined;

  if (key === "tipo") {
    if (ctx.servicios.length > 0) return undefined;
    return !ctx.tipoId ? "Selecciona el tipo de servicio." : undefined;
  }

  if (key === "schedule") return validateScheduleOnly(ctx);

  if (key === "technicians") {
    return !ctx.selectedTechnicians.length ? "Selecciona al menos un tecnico." : undefined;
  }

  if (key === "viaticos") {
    if (!Number.isFinite(ctx.viaticosValue)) return "Viaticos debe ser un numero valido.";
    if (ctx.viaticosValue < 0) return "Viaticos no puede ser negativo.";
    return undefined;
  }

  if (key === "direccion") return validateDireccion(ctx.direccion);

  if (key === "description") return validateDescription(ctx.descripcion);

  if (key === "servicios") {
    return collectServiceErrors(ctx.servicios, ctx.servicesCatalog, false);
  }

  if (key === "materiales") {
    return collectMaterialErrors(ctx.materiales, ctx.productsCatalog, false);
  }

  return undefined;
}

export function validateForm(ctx: ValidationContext): OrderServiceFormErrors {
  const errs: OrderServiceFormErrors = {};

  if (!ctx.clientId) errs.clientId = "Selecciona un cliente.";
  if (!ctx.servicios.length && !ctx.tipoId) errs.tipo = "Selecciona el tipo de servicio.";

  const scheduleError = validateScheduleOnly(ctx);
  if (scheduleError) errs.schedule = scheduleError;

  if (!ctx.selectedTechnicians.length) errs.technicians = "Selecciona al menos un tecnico.";

  if (!Number.isFinite(ctx.viaticosValue)) errs.viaticos = "Viaticos debe ser un numero valido.";
  if (Number.isFinite(ctx.viaticosValue) && ctx.viaticosValue < 0) errs.viaticos = "Viaticos no puede ser negativo.";

  const direccionError = validateDireccion(ctx.direccion);
  if (direccionError) errs.direccion = direccionError;

  const descriptionError = validateDescription(ctx.descripcion);
  if (descriptionError) errs.description = descriptionError;

  const serviciosError = collectServiceErrors(ctx.servicios, ctx.servicesCatalog, true);
  if (serviciosError) errs.servicios = serviciosError;

  const materialesError = collectMaterialErrors(ctx.materiales, ctx.productsCatalog, true);
  if (materialesError) errs.materiales = materialesError;

  return errs;
}
