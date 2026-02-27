"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Colors from "@/shared/theme/colors";
import { showError, showSuccess } from "@/shared/utils/notifications";
import { QuoteCreatePayload, QuoteDetailPayload } from "../types/Quote.type";
import { api } from "@/shared/utils/apiClient";
import { getServicesRequestsForQuote } from "../api/quotes.api";

/* ================================
 * TIPOS
 * ================================ */
type ServiceRequestFromApi = {
  serviceRequestId: number;
  serviceId?: number;
  serviceType: string;
  description: string;
  direccion: string;
  service?: {
    serviceid?: number;
    name?: string;
    typeofserviceid?: number;
  };
  customer: {
    customerid: number;
    users: {
      name: string;
      lastname: string;
      documentnumber: string;
      email: string;
    };
  };
  techniciansMap: Array<{
    technician: {
      technicianid: number;
      users: {
        name: string;
        lastname: string;
        documentnumber: string;
        email: string;
        stateid?: number;
      };
    };
  }>;
};

type ProductFromApi = {
  productid: number;
  productname: string;
  productdescription: string | null;
  productpriceofsale: number;
  productstock: number;
  isactive: boolean;
};

type ServiceFromApi = {
  serviceid: number;
  name: string;
  servicepriceofsale?: number;
  isactive?: boolean;
  typeofserviceid?: number;
  typeofservicename?: string;
  typeofservice?: {
    typeofserviceid?: number;
    name?: string;
    typeofservicename?: string;
  } | null;
};

type QuoteServiceLine = {
  id: string;
  nombre: string;
  precio: number;
  tipoId: number;
};

type ServiceTypeOption = {
  typeofserviceid: number;
  name: string;
  payloadValue: string;
};

const DETAIL_DESCRIPTION_MAX = 150;
const uid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);

const normalizeText = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toPayloadServiceType = (rawType: string) => {
  const normalized = normalizeText(rawType);
  if (normalized.includes("manten")) return "MANTENIMIENTO";
  if (normalized.includes("instal")) return "INSTALACION";
  return String(rawType ?? "").trim().toUpperCase();
};

/* ================================
 * ESTADO DEL FORMULARIO
 * ================================ */
interface QuoteFormState {
  serviceRequestId: number | "";
  statesid: number;
  servicetype: string;
  observation: string;
  details: QuoteDetailPayload[];
}

type NewClientForm = {
  tipo: string;
  documento: string;
  nombre: string;
  apellido?: string;
  telefono: string;
  correo: string;
};

type DocumentTypeApi = {
  typeofdocumentid: number;
  name: string;
};

type RoleApi = {
  roleid: number;
  name: string;
};

interface Props {
  onSave: (payload: QuoteCreatePayload) => Promise<void>;
}

export default function RegisterQuoteForm({ onSave }: Props) {
  /* ================================
   * STATE PRINCIPAL
   * ================================ */
  const [form, setForm] = useState<QuoteFormState>({
    serviceRequestId: "",
    statesid: 5, // Estado por defecto: Pendiente
    servicetype: "",
    observation: "",
    details: [],
  });

  /* ================================
   * SOLICITUDES DE SERVICIO
   * ================================ */
  const [serviceRequests, setServiceRequests] = useState<
    ServiceRequestFromApi[]
  >([]);
  const [selectedServiceRequest, setSelectedServiceRequest] =
    useState<ServiceRequestFromApi | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  /* ================================
   * CLIENTE NUEVO (solo si no hay solicitud)
   * ================================ */
  const [createNewClientEnabled, setCreateNewClientEnabled] = useState(false);
  const [clientForm, setClientForm] = useState<NewClientForm>({
    tipo: "CC",
    documento: "",
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
  });

  /* ================================
   * PRODUCTOS
   * ================================ */
  const [products, setProducts] = useState<ProductFromApi[]>([]);
  const [services, setServices] = useState<ServiceFromApi[]>([]);
  const [serviceLines, setServiceLines] = useState<QuoteServiceLine[]>([]);
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<number | null>(null);

  /* ================================
   * CARGA DE DATOS INICIAL
   * ================================ */
  useEffect(() => {
    const loadData = async () => {
      try {
        const requests = await getServicesRequestsForQuote();
        setServiceRequests(requests);

        const [productsResponse, servicesResponse] = await Promise.all([
          api.get("/products?status=all"),
          api.get("/services"),
        ]);
        setProducts(productsResponse.data);

        const servicesData = Array.isArray(servicesResponse?.data)
          ? servicesResponse.data
          : Array.isArray(servicesResponse?.data?.data)
            ? servicesResponse.data.data
            : [];
        const mappedServices = servicesData
          .map((serviceRaw: unknown) => {
            const s =
              typeof serviceRaw === "object" && serviceRaw !== null
                ? (serviceRaw as Record<string, unknown>)
                : {};
            const flatTypeId = Number(s.typeofserviceid ?? s.typeOfServiceId);
            const nestedType = (s.typeofservice as ServiceFromApi["typeofservice"]) ?? null;
            const nestedTypeId = Number(nestedType?.typeofserviceid);
            const resolvedTypeId = Number.isFinite(nestedTypeId) && nestedTypeId > 0
              ? nestedTypeId
              : Number.isFinite(flatTypeId) && flatTypeId > 0
                ? flatTypeId
                : undefined;
            const resolvedTypeName = String(
              nestedType?.name ??
                nestedType?.typeofservicename ??
                s.typeofservicename ??
                "",
            ).trim();
            return {
              serviceid: Number(s.serviceid ?? s.id),
              name: String(s.name ?? s.servicename ?? "").trim(),
              servicepriceofsale: Number(s.servicepriceofsale ?? s.serviceprice ?? 0),
              isactive:
                typeof s.isactive === "boolean" ? s.isactive : undefined,
              typeofserviceid: resolvedTypeId,
              typeofservicename: resolvedTypeName || undefined,
              typeofservice:
                resolvedTypeId
                  ? {
                      typeofserviceid: resolvedTypeId,
                      name: resolvedTypeName || undefined,
                      typeofservicename: resolvedTypeName || undefined,
                    }
                  : null,
            };
          })
          .filter((s: ServiceFromApi) => Number.isFinite(s.serviceid) && s.serviceid > 0 && !!s.name);
        setServices(mappedServices);
      } catch (error) {
        showError("Error al cargar los datos iniciales");
        console.error(error);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    loadData();
  }, []);

  /* ================================
   * MANEJO DE SELECCIÃ“N DE SERVICE REQUEST (OPCIONAL)
   * ================================ */
  const handleServiceRequestChange = (serviceRequestId: number) => {
    const selected = serviceRequests.find(
      (req) => req.serviceRequestId === serviceRequestId,
    );

    if (!selected) {
      setSelectedServiceRequest(null);
      setForm((prev) => ({
        ...prev,
        serviceRequestId: "",
        servicetype: "",
      }));
      setSelectedServiceTypeId(null);
      setServiceLines([]);
      // si no hay solicitud, por defecto habilitamos creación de cliente
      setCreateNewClientEnabled(false);
      return;
    }

    const normalizedType = toPayloadServiceType(selected.serviceType);
    const requestServiceTypeId = Number(selected.service?.typeofserviceid);
    const inferredTypeId =
      Number.isFinite(requestServiceTypeId) && requestServiceTypeId > 0
        ? requestServiceTypeId
        : inferServiceTypeId(selected.serviceType);

    const typeFromCatalog = serviceTypes.find(
      (type) => type.typeofserviceid === inferredTypeId,
    );
    const resolvedPayloadServiceType =
      typeFromCatalog?.payloadValue ?? normalizedType;

    const requestServiceId = Number(
      selected.service?.serviceid ?? selected.serviceId,
    );
    const requestServiceName = String(selected.service?.name ?? "").trim();

    const matchedCatalogService =
      services.find((srv) => srv.serviceid === requestServiceId) ??
      (inferredTypeId
        ? services.find(
            (srv) =>
              Number(srv.typeofservice?.typeofserviceid) === inferredTypeId &&
              normalizeText(srv.name) === normalizeText(requestServiceName),
          )
        : null);

    const serviceNameToUse = String(
      matchedCatalogService?.name ?? requestServiceName,
    ).trim();
    const servicePriceToUse = Math.max(
      0,
      Math.round(Number(matchedCatalogService?.servicepriceofsale) || 0),
    );

    const autoObservation = [
      selected.direccion ? `Dirección: ${selected.direccion}` : "",
      selected.description ? `Descripción: ${selected.description}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    setSelectedServiceRequest(selected);
    setForm((prev) => ({
      ...prev,
      serviceRequestId: selected.serviceRequestId,
      servicetype: resolvedPayloadServiceType,
      observation: autoObservation || prev.observation,
    }));
    setSelectedServiceTypeId(inferredTypeId);
    setServiceLines(
      inferredTypeId && serviceNameToUse
        ? [
            {
              id: uid(),
              nombre: serviceNameToUse,
              precio: servicePriceToUse,
              tipoId: inferredTypeId,
            },
          ]
        : [],
    );

    // si hay solicitud, no necesitamos crear cliente aquÃ­
    setCreateNewClientEnabled(false);
  };

  /* ================================
   * FILTROS DE PRODUCTOS
   * ================================ */
  const activeProducts = useMemo(
    () => products.filter((p) => p.isactive !== false),
    [products],
  );
  const inStockProducts = useMemo(
    () => activeProducts.filter((p) => Number(p.productstock) > 0),
    [activeProducts],
  );

  const serviceTypes = useMemo<ServiceTypeOption[]>(() => {
    const byType = new Map<number, string>();
    services.forEach((s) => {
      const typeId = Number(s.typeofservice?.typeofserviceid);
      if (!Number.isFinite(typeId) || typeId <= 0) return;
      if (!byType.has(typeId)) {
        const name = String(
          s.typeofservice?.name ??
            s.typeofservice?.typeofservicename ??
            `Tipo #${typeId}`,
        ).trim();
        byType.set(typeId, name || `Tipo #${typeId}`);
      }
    });
    return Array.from(byType.entries())
      .map(([typeofserviceid, name]) => ({
        typeofserviceid,
        name,
        payloadValue: toPayloadServiceType(name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  const inferServiceTypeId = useCallback((rawType: string) => {
    const target = normalizeText(rawType);
    if (!target) return null;

    const exact = serviceTypes.find(
      (t) =>
        normalizeText(t.name) === target ||
        normalizeText(t.payloadValue) === target,
    );
    if (exact) return exact.typeofserviceid;

    if (target.includes("manten")) {
      return (
        serviceTypes.find(
          (t) =>
            normalizeText(t.name).includes("manten") ||
            normalizeText(t.payloadValue).includes("manten"),
        )?.typeofserviceid ?? null
      );
    }

    if (target.includes("instal")) {
      return (
        serviceTypes.find(
          (t) =>
            normalizeText(t.name).includes("instal") ||
            normalizeText(t.payloadValue).includes("instal"),
        )?.typeofserviceid ?? null
      );
    }

    return null;
  }, [serviceTypes]);

  useEffect(() => {
    if (
      selectedServiceTypeId ||
      !form.servicetype ||
      serviceTypes.length === 0
    )
      return;
    const inferred = inferServiceTypeId(form.servicetype);
    if (inferred) setSelectedServiceTypeId(inferred);
  }, [
    form.servicetype,
    inferServiceTypeId,
    selectedServiceTypeId,
    serviceTypes.length,
  ]);

  const getServicesForTipo = useCallback(
    (tipoId: number) =>
      services.filter((s) => {
        if (s.isactive === false) return false;
        return Number(s.typeofservice?.typeofserviceid) === tipoId;
      }),
    [services],
  );

  const canAddServiceRow = useMemo(() => {
    if (!selectedServiceTypeId) return false;
    const usedNames = new Set(
      serviceLines
        .filter((line) => line.tipoId === selectedServiceTypeId)
        .map((line) => String(line.nombre || "").trim())
        .filter(Boolean),
    );
    const available = getServicesForTipo(selectedServiceTypeId).filter(
      (s) => !usedNames.has(s.name),
    );
    return available.length > 0;
  }, [getServicesForTipo, selectedServiceTypeId, serviceLines]);

  /* ================================
   * TOTALES
   * ================================ */
  const subtotal = useMemo(
    () => form.details.reduce((a, d) => a + d.subtotal, 0),
    [form.details],
  );
  const servicesSubtotal = useMemo(
    () =>
      serviceLines.reduce(
        (acc, line) =>
          acc +
          Math.max(0, Math.round(Number(line.precio) || 0)),
        0,
      ),
    [serviceLines],
  );
  const subtotalWithServices = subtotal + servicesSubtotal;
  const tax = Math.round(subtotalWithServices * 0.19);
  const total = subtotalWithServices + tax;

  const mapProductToDetail = (product: ProductFromApi, quantity = 1): QuoteDetailPayload => {
    const unitprice = Number(product.productpriceofsale) || 0;
    const safeDescription = String(
      product.productdescription ?? product.productname,
    ).slice(0, DETAIL_DESCRIPTION_MAX);
    return {
      productid: product.productid,
      name: product.productname,
      description: safeDescription,
      quantity: Math.max(1, Math.round(quantity)),
      unitprice,
      subtotal: Math.max(1, Math.round(quantity)) * unitprice,
      availability: "DISPONIBLE",
    };
  };

  const productOptionsForRow = (currentProductId: number | null) => {
    const used = new Set(
      form.details
        .map((d) => d.productid)
        .filter((id): id is number => Number.isFinite(id as number)),
    );
    if (currentProductId !== null) used.delete(currentProductId);
    return inStockProducts.filter((p) => !used.has(p.productid));
  };

  const addProductRow = () => {
    const used = new Set(
      form.details
        .map((d) => d.productid)
        .filter((id): id is number => Number.isFinite(id as number)),
    );
    const first = inStockProducts.find((p) => !used.has(p.productid));
    if (!first) {
      showError("No hay más productos disponibles para agregar");
      return;
    }
    setForm((prev) => ({ ...prev, details: [...prev.details, mapProductToDetail(first)] }));
  };

  const selectProductForRow = (index: number, productId: number) => {
    const product = inStockProducts.find((p) => p.productid === productId);
    if (!product) {
      showError("Producto no disponible");
      return;
    }
    setForm((prev) => {
      const updated = [...prev.details];
      const current = updated[index];
      if (!current) return prev;
      updated[index] = mapProductToDetail(product, current.quantity);
      return { ...prev, details: updated };
    });
  };

  /* ================================
   * HANDLERS PARA DETALLES
   * ================================ */
  const handleAddDetail = () => {
    addProductRow();
  };

  const handleRemoveDetail = (index: number) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const updateDetailQuantity = (index: number, newQty: number) => {
    setForm((prev) => {
      const updated = [...prev.details];
      const current = updated[index];
      if (!current) return prev;

      let qty = Math.max(1, Number(newQty) || 1);

      const prod = products.find((p) => p.productid === current.productid);
      if (prod && current.productid !== null) {
        const stock = Math.max(0, Number(prod.productstock) || 0);
        if (stock === 0) {
          showError("Este producto ya no tiene stock disponible");
          return prev;
        }
        qty = Math.min(qty, stock);
      }

      updated[index] = {
        ...current,
        quantity: qty,
        subtotal: qty * current.unitprice,
      };
      return { ...prev, details: updated };
    });
  };

  const findServiceByNameAndType = (tipoId: number, serviceName: string) => {
    const normalized = normalizeText(serviceName);
    if (!normalized) return null;
    return (
      services.find(
        (s) =>
          Number(s.typeofservice?.typeofserviceid) === tipoId &&
          normalizeText(s.name) === normalized,
      ) ??
      null
    );
  };

  const serviceOptionsForRow = (tipoId: number, currentName: string) => {
    const base = getServicesForTipo(tipoId);
    if (!base.length) return [];
    const usedNames = new Set(
      serviceLines
        .filter((line) => line.tipoId === tipoId)
        .map((line) => String(line.nombre || "").trim())
        .filter(Boolean),
    );
    if (currentName) usedNames.delete(currentName);
    return base.filter((service) => !usedNames.has(service.name));
  };

  const addServiceRow = () => {
    if (!selectedServiceTypeId) {
      showError("Seleccione primero el tipo de servicio");
      return;
    }
    const options = serviceOptionsForRow(selectedServiceTypeId, "");
    const first = options[0];
    if (!first) {
      showError("No hay servicios disponibles para agregar");
      return;
    }

    setServiceLines((prev) => [
      ...prev,
      {
        id: uid(),
        nombre: first.name,
        precio: 0,
        tipoId: selectedServiceTypeId,
      },
    ]);
  };

  const updateServiceLine = (id: string, patch: Partial<QuoteServiceLine>) => {
    setServiceLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  };

  const removeServiceLine = (id: string) => {
    setServiceLines((prev) => prev.filter((line) => line.id !== id));
  };

  const createCustomerForDirectQuote = async (): Promise<number> => {
    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const [{ data: rawDocTypes }, { data: rawRoles }] = await Promise.all([
      api.get("/typeofdocuments"),
      api.get("/roles/list"),
    ]);

    const docTypes: DocumentTypeApi[] = Array.isArray(rawDocTypes)
      ? rawDocTypes
      : rawDocTypes?.data ?? [];
    const roles: RoleApi[] = Array.isArray(rawRoles)
      ? rawRoles
      : rawRoles?.data ?? [];

    const selectedDocType = docTypes.find(
      (d) => normalize(d.name) === normalize(clientForm.tipo),
    );
    if (!selectedDocType) {
      throw new Error(`No se encontró el tipo de documento ${clientForm.tipo}`);
    }

    const clientRole = roles.find((r) => normalize(r.name) === "cliente");
    if (!clientRole) {
      throw new Error("No se encontró el rol Cliente");
    }

    const userPayload = {
      name: clientForm.nombre.trim(),
      lastname: (clientForm.apellido ?? "").trim(),
      email: clientForm.correo.trim(),
      phone: clientForm.telefono.replace(/\D/g, ""),
      typeid: selectedDocType.typeofdocumentid,
      stateid: 1,
      roleid: clientRole.roleid,
      documentnumber: clientForm.documento.trim(),
      customercity: "",
      customerzipcode: "",
      image: "",
    };

    const createdUserRes = await api.post("/users", userPayload);
    const userId = Number(
      createdUserRes?.data?.data?.userid ?? createdUserRes?.data?.userid,
    );
    if (!userId) {
      throw new Error("No se pudo obtener el usuario creado");
    }

    const customerRes = await api.get(`/customers/user/${userId}`);
    const customerId = Number(
      customerRes?.data?.customerid ?? customerRes?.data?.data?.customerid,
    );
    if (!customerId) {
      throw new Error("No se pudo obtener el cliente creado");
    }

    return customerId;
  };

  /* ================================
   * HANDLER PARA ENVIAR FORMULARIO
   * ================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) Ya NO exigimos solicitud. SÃ­ exigimos tipo de servicio.
    if (!form.servicetype) {
      showError("Debe seleccionar el tipo de servicio");
      return;
    }

    const invalidServiceLine = serviceLines.some((line) => {
      if (!Number.isFinite(line.tipoId) || line.tipoId <= 0) return true;
      if (!line.nombre?.trim()) return true;
      if (!Number.isFinite(line.precio) || line.precio < 0) return true;
      return !findServiceByNameAndType(line.tipoId, line.nombre);
    });
    if (invalidServiceLine) {
      showError("Hay servicios inválidos. Vuelve a seleccionarlos.");
      return;
    }

    const validServiceLines = serviceLines.filter(
      (line) =>
        Number.isFinite(line.tipoId) &&
        line.tipoId > 0 &&
        !!line.nombre?.trim() &&
        Number.isFinite(line.precio) &&
        line.precio >= 0,
    );

    if (form.details.length === 0 && validServiceLines.length === 0) {
      showError("Agrega al menos un item (producto o servicio)");
      return;
    }

    // Preparar el payload según la especificación del endpoint
    let directCustomerId: number | undefined;
    if (!form.serviceRequestId && createNewClientEnabled) {
      try {
        directCustomerId = await createCustomerForDirectQuote();
      } catch (error) {
        const axiosError = error as {
          response?: { data?: { message?: string | string[] } };
          message?: string;
        };
        const backendMessage = axiosError?.response?.data?.message;
        const message = Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || axiosError?.message || "Error al crear el cliente";
        showError(message);
        return;
      }
    }

    const payload: QuoteCreatePayload = {
      ...(form.serviceRequestId
        ? { serviceRequestId: Number(form.serviceRequestId) }
        : {}),
      ...(!form.serviceRequestId && directCustomerId
        ? { customerid: directCustomerId }
        : {}),
      statesid: form.statesid,
      servicetype: form.servicetype,
      observation: form.observation,
      details: [
        ...form.details.map((detail) => ({
          productid: detail.productid ?? null,
          description: detail.description,
          quantity: detail.quantity,
          unitprice: detail.unitprice,
          subtotal: detail.subtotal,
          availability: detail.availability,
        })),
        ...validServiceLines.map((line) => {
          const selected = findServiceByNameAndType(line.tipoId, line.nombre);
          const unitprice = Math.max(0, Math.round(Number(line.precio) || 0));
          return {
            productid: null,
            description: `Servicio: ${selected?.name ?? line.nombre}`,
            quantity: 1,
            unitprice,
            subtotal: unitprice,
            availability: "DISPONIBLE" as const,
          };
        }),
      ],
    };

    try {
      await onSave?.(payload);
      showSuccess("CotizaciÃ³n guardada exitosamente");

      // Reset
      setForm({
        serviceRequestId: "",
        statesid: 5,
        servicetype: "",
        observation: "",
        details: [],
      });
      setSelectedServiceRequest(null);
      setSelectedServiceTypeId(null);
      setCreateNewClientEnabled(false);
      setClientForm({
        tipo: "CC",
        documento: "",
        nombre: "",
        apellido: "",
        telefono: "",
        correo: "",
      });
      setServiceLines([]);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const backendMessage = axiosError?.response?.data?.message;
      const message = Array.isArray(backendMessage)
        ? backendMessage.join(", ")
        : backendMessage || axiosError?.message || "Error al guardar la cotización";
      showError(message);
    }
  };

  /* ================================
   * RENDER
   * ================================ */
  if (isLoadingRequests) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-gray-500">Cargando datos...</div>
      </div>
    );
  }

  const hasRequiredNewClientData =
    !!clientForm.documento.trim() &&
    !!clientForm.nombre.trim() &&
    !!clientForm.telefono.trim() &&
    !!clientForm.correo.trim();

  const canSubmit =
    !!form.servicetype &&
    (form.details.length > 0 || serviceLines.length > 0) &&
    (form.serviceRequestId
      ? true
      : !createNewClientEnabled || hasRequiredNewClientData);

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-4 p-3 text-sm xl:grid-cols-12"
    >
      <div className="space-y-4 xl:col-span-8">
      {/* SOLICITUD DE SERVICIO (OPCIONAL) */}
      <section className="rounded-lg border bg-white shadow-sm">
        <header className="border-b px-3 py-2.5">
          <h3 className="text-sm font-semibold text-gray-800">Solicitud de servicio</h3>
          <p className="text-xs text-gray-500">Puedes cotizar con o sin solicitud asociada.</p>
        </header>
        <div className="p-3">
        <label className="block mb-1 font-medium">
          Solicitud de servicio (opcional)
        </label>
        <select
          value={form.serviceRequestId}
          onChange={(e) => handleServiceRequestChange(Number(e.target.value))}
          className="h-9 w-full rounded-md border px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sin solicitud (cotizaciÃ³n directa)</option>
          {serviceRequests.map((request) => {
            const customerLabel = request.customer?.users
              ? `${request.customer.users.name} ${request.customer.users.lastname}`
              : "Cliente no disponible";

            return (
              <option
                key={request.serviceRequestId}
                value={request.serviceRequestId}
              >
                #{request.serviceRequestId} - {customerLabel} -{" "}
                {request.serviceType}
              </option>
            );
          })}
        </select>
        </div>
      </section>

      {/* INFO AUTOMÃTICA DEL SERVICE REQUEST */}
      {selectedServiceRequest && (
        <section className="rounded-lg border bg-white shadow-sm">
          <header className="border-b px-3 py-2.5">
            <h3 className="text-sm font-semibold text-gray-800">
              Información de la solicitud seleccionada
            </h3>
          </header>
          <div className="p-3">
          <h3 className="font-bold text-gray-700 sr-only">
            Información de la solicitud seleccionada
          </h3>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <div className="text-xs text-gray-500">Cliente</div>
              <div className="font-medium">
                {selectedServiceRequest.customer.users.name}{" "}
                {selectedServiceRequest.customer.users.lastname}
              </div>
              <div className="text-sm text-gray-600">
                Documento:{" "}
                {selectedServiceRequest.customer.users.documentnumber}
              </div>
              <div className="text-sm text-gray-600">
                Email: {selectedServiceRequest.customer.users.email}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-500">TÃ©cnico asignado</div>
              {selectedServiceRequest.techniciansMap &&
              selectedServiceRequest.techniciansMap.length > 0 ? (
                <>
                  <div className="font-medium">
                    {
                      selectedServiceRequest.techniciansMap[0].technician.users
                        .name
                    }{" "}
                    {
                      selectedServiceRequest.techniciansMap[0].technician.users
                        .lastname
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    Documento:{" "}
                    {
                      selectedServiceRequest.techniciansMap[0].technician.users
                        .documentnumber
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    Email:{" "}
                    {
                      selectedServiceRequest.techniciansMap[0].technician.users
                        .email
                    }
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No hay tÃ©cnico asignado
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-500">Tipo de servicio</div>
              <div className="font-medium">
                {selectedServiceRequest.serviceType}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-500">DirecciÃ³n</div>
              <div className="font-medium">
                {selectedServiceRequest.direccion}
              </div>
            </div>

            <div className="space-y-1 xl:col-span-2">
              <div className="text-xs text-gray-500">
                DescripciÃ³n del servicio
              </div>
              <div className="font-medium">
                {selectedServiceRequest.description}
              </div>
            </div>
          </div>
          </div>
        </section>
      )}

      {/* CLIENTE NUEVO (solo si NO hay solicitud seleccionada) */}
      {!selectedServiceRequest && (
        <section className="rounded-lg border bg-white shadow-sm">
          <header className="border-b px-3 py-2.5 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-800">Cliente</h3>
          </header>
          <div className="p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createNewClientEnabled}
                onChange={(e) => setCreateNewClientEnabled(e.target.checked)}
              />
              Crear cliente nuevo (opcional)
            </label>
          </div>

          {createNewClientEnabled ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <label className="block mb-1 font-medium">Tipo documento</label>
                <select
                  value={clientForm.tipo}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, tipo: e.target.value }))
                  }
                  className="h-9 w-full rounded-md border px-2.5"
                >
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="NIT">NIT</option>
                  <option value="PAS">PAS</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">Documento *</label>
                <input
                  value={clientForm.documento}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, documento: e.target.value }))
                  }
                  className="h-9 w-full rounded-md border px-2.5"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Nombre *</label>
                <input
                  value={clientForm.nombre}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, nombre: e.target.value }))
                  }
                  className="h-9 w-full rounded-md border px-2.5"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Apellido</label>
                <input
                  value={clientForm.apellido ?? ""}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, apellido: e.target.value }))
                  }
                  className="h-9 w-full rounded-md border px-2.5"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">TelÃ©fono *</label>
                <input
                  value={clientForm.telefono}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, telefono: e.target.value }))
                  }
                  className="h-9 w-full rounded-md border px-2.5"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Correo *</label>
                <input
                  type="email"
                  value={clientForm.correo}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, correo: e.target.value }))
                  }
                  className="h-9 w-full rounded-md border px-2.5"
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded p-3">
              Esta cotización se guardará sin cliente asociado.
            </div>
          )}
          </div>
        </section>
      )}

      {/* SERVICIOS A COTIZAR */}
      <section className="rounded-lg border bg-white shadow-sm">
        <header className="border-b px-3 py-2.5 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Servicios a cotizar</h3>
            <p className="text-xs text-gray-500">Tipo de servicio, servicios y observación.</p>
          </div>
          <button
            type="button"
            onClick={addServiceRow}
            className="h-8 rounded-md border bg-white px-2.5 text-xs hover:bg-gray-50 disabled:opacity-60"
            disabled={!canAddServiceRow}
          >
            Añadir servicio
          </button>
        </header>
        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-12">
          <div className="md:col-span-12">
            <span className="block text-xs text-gray-700 mb-2">Tipo de servicio</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {serviceTypes.length === 0 ? (
                <div className="text-xs text-gray-500">No hay tipos cargados desde la API.</div>
              ) : (
                serviceTypes.map((type) => {
                  const isSelected = selectedServiceTypeId === type.typeofserviceid;
                  return (
                    <label
                      key={type.typeofserviceid}
                      className={`flex items-center gap-2 rounded-md border bg-white px-2.5 py-2 ${
                        selectedServiceRequest ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-gray-50"
                      } ${isSelected ? "ring-2 ring-red-200 border-red-200" : ""}`}
                    >
                      <input
                        type="radio"
                        name="tipo-servicio-cotizacion"
                        value={String(type.typeofserviceid)}
                        checked={isSelected}
                        disabled={!!selectedServiceRequest}
                        onChange={(e) => {
                          const nextTypeId = Number(e.target.value);
                          const selectedType = serviceTypes.find((t) => t.typeofserviceid === nextTypeId) ?? null;
                          setSelectedServiceTypeId(Number.isFinite(nextTypeId) ? nextTypeId : null);
                          setForm((prev) => ({
                            ...prev,
                            servicetype: selectedType?.payloadValue ?? "",
                          }));
                          setServiceLines([]);
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium text-gray-900">{type.name}</span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedServiceRequest
                ? "Este campo se completa automáticamente desde la solicitud de servicio."
                : "Selecciona un tipo para habilitar la carga de servicios."}
            </p>
          </div>

          <div className="md:col-span-12">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-xs text-gray-500">
                Cantidad fija 1 por servicio, editable en precio y sin duplicados.
              </div>
            </div>
            <div className="overflow-hidden rounded-md border bg-white">
          <table className="w-full text-xs md:text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-700">
                <th className="px-3 py-2 text-left">Servicio</th>
                <th className="px-3 py-2 text-right w-40">Precio</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {serviceLines.map((line) => {
                const options = serviceOptionsForRow(line.tipoId, line.nombre);
                const hasCurrent = !!line.nombre && getServicesForTipo(line.tipoId).some((service) => service.name === line.nombre);
                const safeOptions = hasCurrent
                  ? [{ serviceid: -1, name: line.nombre }, ...options]
                  : options;

                return (
                  <tr key={line.id} className="border-t">
                    <td className="px-3 py-2">
                      <select
                        value={line.nombre}
                        onChange={(e) => {
                          const nextServiceName = e.target.value;
                          updateServiceLine(line.id, {
                            nombre: nextServiceName,
                          });
                        }}
                        className="h-9 w-full rounded-md border px-2 text-sm"
                      >
                        {safeOptions.map((service, idx) => (
                          <option key={`${line.id}-${service.serviceid}-${idx}`} value={service.name}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={Number.isFinite(line.precio) ? line.precio : 0}
                        onChange={(e) =>
                          updateServiceLine(line.id, {
                            precio: Math.max(0, Math.round(Number(e.target.value || 0))),
                          })
                        }
                        className="h-9 w-32 rounded-md border px-2 text-right text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeServiceLine(line.id)}
                        className="h-9 w-9 rounded-md text-red-600 hover:bg-gray-100"
                        aria-label="Quitar servicio"
                        title="Quitar"
                      >
                        x
                      </button>
                    </td>
                  </tr>
                );
              })}
              {serviceLines.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                    {selectedServiceTypeId
                      ? "Aún no has añadido servicios."
                      : "Selecciona primero el tipo de servicio."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
            </div>
          </div>

          <div className="md:col-span-12">
            <label className="block text-xs text-gray-700 mb-1">Observación</label>
            <textarea
              placeholder="Describe alcance, observaciones o condiciones de la cotización"
              value={form.observation}
              onChange={(e) => setForm({ ...form, observation: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={2}
            />
          </div>
        </div>
      </section>

            {/* DETALLES DE PRODUCTOS */}
      <section className="rounded-lg border bg-white shadow-sm">
        <header className="border-b px-3 py-2.5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Productos (Materiales)</h3>
            <p className="text-xs text-gray-500">Agrega los materiales consumidos. Puedes ajustar la cantidad.</p>
          </div>
          <div className="text-xs text-gray-500">Subtotal: ${subtotal.toLocaleString("es-CO")}</div>
        </header>

        <div className="p-3">
          <div className="space-y-2 rounded-md border bg-white p-2.5">
            {form.details.length === 0 ? (
              <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-gray-500">
                Aún no has añadido productos.
              </div>
            ) : (
              form.details.map((item, index) => {
                const options = productOptionsForRow(item.productid ?? null);
                const currentProduct =
                  item.productid !== null
                    ? activeProducts.find((p) => p.productid === item.productid) ?? null
                    : null;
                const safeOptions = currentProduct
                  ? [currentProduct, ...options.filter((p) => p.productid !== currentProduct.productid)]
                  : options;

                return (
                  <div key={`${item.productid ?? "none"}-${index}`} className="space-y-1.5 rounded-md border bg-gray-50 p-2">
                    <label className="block text-[10px] text-gray-600">Producto</label>
                    <select
                      value={item.productid ?? ""}
                      onChange={(e) => selectProductForRow(index, Number(e.target.value))}
                      className="h-9 w-full rounded-md border bg-white px-2.5 text-xs"
                    >
                      {safeOptions.map((p) => (
                        <option key={p.productid} value={p.productid}>
                          {p.productname}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-end gap-1.5">
                      <div className="w-16 shrink-0">
                        <label className="mb-1 block text-[10px] text-gray-600">Cant.</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={item.quantity}
                          onChange={(e) => updateDetailQuantity(index, Number(e.target.value))}
                          className="h-9 w-full rounded-md border bg-white px-2 text-center text-xs"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="mb-1 block text-[10px] text-gray-600">Precio</span>
                        <div className="flex h-9 items-center justify-end rounded-md border bg-white px-2.5 text-xs font-medium text-gray-900">
                          ${Number(item.unitprice || 0).toLocaleString("es-CO")}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDetail(index)}
                        className="h-9 w-9 shrink-0 rounded-md border bg-white hover:bg-gray-100"
                        aria-label="Quitar producto"
                        title="Quitar"
                      >
                        x
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                      <span>Disponible</span>
                      <span>Subtotal: ${Number(item.subtotal || 0).toLocaleString("es-CO")}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={handleAddDetail}
              className="h-9 w-full rounded-md border bg-gray-100 text-xs hover:bg-gray-50 disabled:opacity-60"
              disabled={form.details.length >= inStockProducts.length || inStockProducts.length === 0}
              title={
                form.details.length >= inStockProducts.length
                  ? "Ya agregaste todos los productos disponibles."
                  : undefined
              }
            >
              {form.details.length >= inStockProducts.length
                ? "No hay más productos disponibles"
                : "Añadir producto"}
            </button>
          </div>
        </div>
      </section>
      </div>

      <aside className="space-y-4 xl:col-span-4 xl:sticky xl:top-3 self-start">
        <section className="rounded-lg border bg-white shadow-sm">
          <header className="border-b px-3 py-2.5">
            <h3 className="text-sm font-semibold text-gray-800">Resumen financiero</h3>
          </header>
          <div className="space-y-1.5 p-3">
            <div className="flex justify-between">
              <span>Subtotal productos:</span>
              <span>${subtotal.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal servicios:</span>
              <span>${servicesSubtotal.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal base:</span>
              <span>${subtotalWithServices.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (19%):</span>
              <span>${tax.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total:</span>
              <span>${total.toLocaleString("es-CO")}</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-3 shadow-sm">
          <button
            type="submit"
            style={{ backgroundColor: Colors.buttons.primary }}
            className="h-10 w-full cursor-pointer rounded-md px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={!canSubmit}
            title={
              !canSubmit
                ? "Completa tipo de servicio, agrega productos o servicios y, si eliges crear cliente, sus datos obligatorios"
                : ""
            }
          >
            Guardar Cotización
          </button>
        </section>
      </aside>
    </form>
  );
}




