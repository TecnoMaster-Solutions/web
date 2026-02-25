"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Colors from "@/shared/theme/colors";
import { showError, showSuccess } from "@/shared/utils/notifications";
import { QuoteCreatePayload, QuoteDetailPayload } from "../types/Quote.type";
import { api } from "@/shared/utils/apiClient";
import { getServicesRequestsForQuote } from "../api/quotes.api";
import AutoGrowTextarea from "@/components/ui/AutoGrowTextarea";
import { createClient, CreateClientPayload } from "../../Clients/api/clients.api";

/* ================================
 * TIPOS
 * ================================ */
type ServiceRequestFromApi = {
  serviceRequestId: number;
  serviceType: string;
  description: string;
  direccion: string;
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
  contrasena: string;
};

interface Props {
  onSave?: (payload: QuoteCreatePayload) => Promise<void>;
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
  const [createNewClientEnabled, setCreateNewClientEnabled] = useState(true);
  const [clientForm, setClientForm] = useState<NewClientForm>({
    tipo: "CC",
    documento: "",
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    contrasena: "",
  });

  /* ================================
   * PRODUCTOS
   * ================================ */
  const [products, setProducts] = useState<ProductFromApi[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [isManualProduct, setIsManualProduct] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);
  const [pendingBackorderProduct, setPendingBackorderProduct] =
    useState<ProductFromApi | null>(null);

  /* ================================
   * DETALLE ACTUAL
   * ================================ */
  const [detailForm, setDetailForm] = useState<QuoteDetailPayload>({
    productid: null,
    name: "",
    description: "",
    quantity: 1,
    unitprice: 0,
    subtotal: 0,
    availability: "DISPONIBLE",
    isBackorder: false,
  });

  /* ================================
   * EFECTOS PARA CERRAR LISTAS AL HACER CLICK AFUERA
   * ================================ */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productRef.current &&
        !productRef.current.contains(event.target as Node)
      ) {
        setShowProductList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================================
   * CARGA DE DATOS INICIAL
   * ================================ */
  useEffect(() => {
    const loadData = async () => {
      try {
        const requests = await getServicesRequestsForQuote();
        setServiceRequests(requests);

        const productsResponse = await api.get("/products?status=all");
        setProducts(productsResponse.data);
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
   * MANEJO DE SELECCIÓN DE SERVICE REQUEST (OPCIONAL)
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
      // si no hay solicitud, por defecto habilitamos creación de cliente
      setCreateNewClientEnabled(true);
      return;
    }

    setSelectedServiceRequest(selected);
    setForm((prev) => ({
      ...prev,
      serviceRequestId: selected.serviceRequestId,
      servicetype: selected.serviceType,
    }));

    // si hay solicitud, no necesitamos crear cliente aquí
    setCreateNewClientEnabled(false);
  };

  /* ================================
   * FILTROS DE PRODUCTOS
   * ================================ */
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.productname.toLowerCase().includes(q) ||
        p.productid.toString().includes(q),
    );
  }, [productSearch, products]);

  /* ================================
   * TOTALES
   * ================================ */
  const subtotal = useMemo(
    () => form.details.reduce((a, d) => a + d.subtotal, 0),
    [form.details],
  );
  const tax = Math.round(subtotal * 0.19);
  const total = subtotal + tax;

  /* ================================
   * HANDLERS PARA PRODUCTOS
   * ================================ */
  const handleProductModeChange = (manual: boolean) => {
    setIsManualProduct(manual);
    setProductSearch("");
    setShowProductList(false);
    setPendingBackorderProduct(null);
    setDetailForm({
      productid: null,
      name: "",
      description: "",
      quantity: 1,
      unitprice: 0,
      subtotal: 0,
      availability: manual ? "SOLICITAR" : "DISPONIBLE",
      isBackorder: false,
    });
  };

  const applyProductSelection = (
    product: ProductFromApi,
    isBackorder: boolean,
  ) => {
    const unitprice = Number(product.productpriceofsale);

    setDetailForm({
      productid: product.productid,
      name: product.productname,
      description: product.productdescription ?? "",
      quantity: 1,
      unitprice,
      subtotal: unitprice,
      availability: isBackorder ? "SOLICITAR" : "DISPONIBLE",
      isBackorder,
    });

    setProductSearch(product.productname);
    setShowProductList(false);
    setPendingBackorderProduct(null);
  };

  const handleBackorderConfirm = () => {
    if (!pendingBackorderProduct) return;
    applyProductSelection(pendingBackorderProduct, true);
  };

  const handleBackorderCancel = () => {
    setPendingBackorderProduct(null);
  };

  const handleSelectProduct = (product: ProductFromApi) => {
    if (product.productstock === 0) {
      setPendingBackorderProduct(product);
      setShowProductList(false);
      return;
    }
    applyProductSelection(product, false);
  };

  /* ================================
   * HANDLERS PARA DETALLES
   * ================================ */
  const normalizeDescription = (value: string) => value.trim().toLowerCase();

  const handleAddDetail = () => {
    if (!detailForm.description.trim()) {
      showError("La descripción es obligatoria");
      return;
    }
    if (detailForm.quantity <= 0 || detailForm.unitprice < 0) {
      showError("Cantidad y precio inválidos");
      return;
    }

    const subtotal = detailForm.quantity * detailForm.unitprice;

    let availability = detailForm.availability;
    if (isManualProduct) {
      availability = "SOLICITAR";
    } else if (detailForm.productid === null) {
      availability = "NO_DISPONIBLE";
    }

    const detailPayload: QuoteDetailPayload = {
      ...detailForm,
      productid: isManualProduct ? null : detailForm.productid,
      subtotal,
      availability,
      isBackorder: detailForm.isBackorder ?? false,
    };

    setForm((prev) => {
      const updatedDetails = [...prev.details];
      const normalizedDescription = normalizeDescription(
        detailPayload.description,
      );

      if (detailPayload.productid !== null) {
        const existingIndex = updatedDetails.findIndex(
          (d) => d.productid === detailPayload.productid,
        );
        if (existingIndex >= 0) {
          const existing = updatedDetails[existingIndex];
          const mergedQuantity = existing.quantity + detailPayload.quantity;
          updatedDetails[existingIndex] = {
            ...existing,
            quantity: mergedQuantity,
            unitprice: detailPayload.unitprice,
            subtotal: mergedQuantity * detailPayload.unitprice,
            availability: existing.availability,
            isBackorder:
              (existing.isBackorder ?? false) || detailPayload.isBackorder,
          };
        } else {
          updatedDetails.push(detailPayload);
        }
      } else {
        const existingIndex = updatedDetails.findIndex(
          (d) =>
            d.productid === null &&
            normalizeDescription(d.description) === normalizedDescription,
        );
        if (existingIndex >= 0) {
          const existing = updatedDetails[existingIndex];
          const mergedQuantity = existing.quantity + detailPayload.quantity;
          updatedDetails[existingIndex] = {
            ...existing,
            quantity: mergedQuantity,
            unitprice: detailPayload.unitprice,
            subtotal: mergedQuantity * detailPayload.unitprice,
            availability: existing.availability,
            isBackorder:
              (existing.isBackorder ?? false) || detailPayload.isBackorder,
          };
        } else {
          updatedDetails.push(detailPayload);
        }
      }

      return { ...prev, details: updatedDetails };
    });

    setDetailForm({
      productid: null,
      name: "",
      description: "",
      quantity: 1,
      unitprice: 0,
      subtotal: 0,
      availability: isManualProduct ? "SOLICITAR" : "DISPONIBLE",
      isBackorder: false,
    });

    setProductSearch("");
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
      if (prod && current.productid !== null && !current.isBackorder) {
        qty = Math.min(qty, prod.productstock);
      }

      updated[index] = {
        ...current,
        quantity: qty,
        subtotal: qty * current.unitprice,
      };
      return { ...prev, details: updated };
    });
  };

  const changeDetailQuantityBy = (index: number, delta: number) => {
    setForm((prev) => {
      const updated = [...prev.details];
      const current = updated[index];
      if (!current) return prev;

      const qty = Math.max(1, current.quantity + delta);
      updated[index] = {
        ...current,
        quantity: qty,
        subtotal: qty * current.unitprice,
      };
      return { ...prev, details: updated };
    });
  };

  /* ================================
   * HANDLER PARA ENVIAR FORMULARIO
   * ================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) Ya NO exigimos solicitud. Sí exigimos tipo de servicio.
    if (!form.servicetype) {
      showError("Debe seleccionar el tipo de servicio");
      return;
    }

    if (form.details.length === 0) {
      showError("Agrega al menos un producto");
      return;
    }

    // 2) Si NO hay solicitud, exigimos crear cliente (según requerimiento)
    const isWithoutServiceRequest = !form.serviceRequestId;
    if (isWithoutServiceRequest) {
      if (!createNewClientEnabled) {
        showError("Para cotizar sin solicitud, debe crear un cliente nuevo");
        return;
      }
      if (
        !clientForm.documento.trim() ||
        !clientForm.nombre.trim() ||
        !clientForm.telefono.trim() ||
        !clientForm.correo.trim() ||
        !clientForm.contrasena.trim()
      ) {
        showError("Completa los datos obligatorios del cliente");
        return;
      }
    }

    try {
      // 3) Crear cliente si aplica
      let createdClientId: number | null = null;

      if (isWithoutServiceRequest && createNewClientEnabled) {
        const payloadClient: CreateClientPayload = {
          tipo: clientForm.tipo,
          documento: clientForm.documento.trim(),
          nombre: clientForm.nombre.trim(),
          apellido: clientForm.apellido?.trim() || null,
          telefono: clientForm.telefono.trim(),
          correo: clientForm.correo.trim(),
          rol: "Cliente",
          estado: true,
          contrasena: clientForm.contrasena,
        };

        const created: any = await createClient(payloadClient);
        createdClientId =
          created?.clientid ?? created?.customerid ?? created?.id ?? null;

        if (!createdClientId) {
          showError("Cliente creado, pero no se recibió el ID del cliente");
          return;
        }
      }

      // 4) Crear payload de cotización
      // NOTA: Aquí incluimos serviceRequestId como null si no hay solicitud
      // y mandamos clientId si se creó cliente.
      const quotePayload: any = {
        serviceRequestId: form.serviceRequestId
          ? Number(form.serviceRequestId)
          : null,
        statesid: form.statesid,
        servicetype: form.servicetype as "MANTENIMIENTO" | "INSTALACION",
        observation: form.observation,
        details: form.details.map(({ isBackorder, ...detail }) => ({
          ...detail,
          productid: detail.productid ?? null,
        })),
        ...(createdClientId ? { clientId: createdClientId } : {}),
      };

      // onSave está tipado con QuoteCreatePayload (sin clientId / sin null)
      // por eso lo casteamos: el backend debe soportar este caso “sin solicitud”.
      await onSave?.(quotePayload as QuoteCreatePayload);

      showSuccess("Cotización guardada exitosamente");

      // Reset
      setForm({
        serviceRequestId: "",
        statesid: 5,
        servicetype: "",
        observation: "",
        details: [],
      });
      setSelectedServiceRequest(null);
      setCreateNewClientEnabled(true);
      setClientForm({
        tipo: "CC",
        documento: "",
        nombre: "",
        apellido: "",
        telefono: "",
        correo: "",
        contrasena: "",
      });
      setDetailForm({
        productid: null,
        name: "",
        description: "",
        quantity: 1,
        unitprice: 0,
        subtotal: 0,
        availability: "DISPONIBLE",
        isBackorder: false,
      });
      setProductSearch("");
    } catch (error) {
      console.error(error);
      showError("Error al guardar la cotización");
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

  const canSubmit =
    !!form.servicetype &&
    form.details.length > 0 &&
    (form.serviceRequestId
      ? true
      : createNewClientEnabled &&
        !!clientForm.documento.trim() &&
        !!clientForm.nombre.trim() &&
        !!clientForm.telefono.trim() &&
        !!clientForm.correo.trim() &&
        !!clientForm.contrasena.trim());

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 text-sm">
      {/* SOLICITUD DE SERVICIO (OPCIONAL) */}
      <div>
        <label className="block mb-1 font-medium">
          Solicitud de servicio (opcional)
        </label>
        <select
          value={form.serviceRequestId}
          onChange={(e) => handleServiceRequestChange(Number(e.target.value))}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sin solicitud (cotización directa)</option>
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

      {/* INFO AUTOMÁTICA DEL SERVICE REQUEST */}
      {selectedServiceRequest && (
        <div className="border p-4 rounded-lg bg-gray-50 space-y-3">
          <h3 className="font-bold text-gray-700">
            Información de la solicitud seleccionada
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div className="text-xs text-gray-500">Técnico asignado</div>
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
                  No hay técnico asignado
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
              <div className="text-xs text-gray-500">Dirección</div>
              <div className="font-medium">
                {selectedServiceRequest.direccion}
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-gray-500">
                Descripción del servicio
              </div>
              <div className="font-medium">
                {selectedServiceRequest.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLIENTE NUEVO (solo si NO hay solicitud seleccionada) */}
      {!selectedServiceRequest && (
        <div className="border p-4 rounded-lg bg-gray-50 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-gray-700">Cliente</h3>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createNewClientEnabled}
                onChange={(e) => setCreateNewClientEnabled(e.target.checked)}
              />
              Crear cliente nuevo
            </label>
          </div>

          {createNewClientEnabled ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-medium">Tipo documento</label>
                <select
                  value={clientForm.tipo}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, tipo: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
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
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Nombre *</label>
                <input
                  value={clientForm.nombre}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, nombre: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Apellido</label>
                <input
                  value={clientForm.apellido ?? ""}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, apellido: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Teléfono *</label>
                <input
                  value={clientForm.telefono}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, telefono: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
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
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">Contraseña *</label>
                <input
                  type="password"
                  value={clientForm.contrasena}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, contrasena: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se creará el usuario con rol Cliente
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
              Para cotizar sin solicitud, debe crear un cliente nuevo.
            </div>
          )}
        </div>
      )}

      {/* TIPO DE SERVICIO (auto si hay solicitud / manual si no hay) */}
      <div>
        <label className="block mb-1 font-medium">Tipo de servicio *</label>

        {selectedServiceRequest ? (
          <>
            <input
              type="text"
              value={form.servicetype}
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este campo se completa automáticamente desde la solicitud de
              servicio
            </p>
          </>
        ) : (
          <>
            <select
              value={form.servicetype}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, servicetype: e.target.value }))
              }
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un tipo</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
              <option value="INSTALACION">INSTALACION</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Si no hay solicitud, debe elegir el tipo manualmente
            </p>
          </>
        )}
      </div>

      {/* OBSERVACIÓN */}
      <div>
        <label className="block mb-1 font-medium">Observación</label>
        <textarea
          placeholder="Observaciones adicionales sobre la cotización"
          value={form.observation}
          onChange={(e) => setForm({ ...form, observation: e.target.value })}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* DETALLES DE PRODUCTOS */}
      <div className="border p-4 rounded-lg bg-gray-50">
        <h3 className="font-bold mb-3">Detalles de productos</h3>

        {/* SELECTOR DE MODO */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => handleProductModeChange(false)}
            className={`px-4 py-2 rounded ${!isManualProduct ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Producto existente
          </button>
          <button
            type="button"
            onClick={() => handleProductModeChange(true)}
            className={`px-4 py-2 rounded ${isManualProduct ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Producto manual (para comprar)
          </button>
        </div>

        {/* BUSCADOR DE PRODUCTOS EXISTENTES */}
        {!isManualProduct && (
          <div ref={productRef} className="relative mb-4">
            <label className="block mb-1 font-medium">
              Buscar producto existente
            </label>
            <input
              type="text"
              placeholder="Escriba para buscar productos..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductList(true);
              }}
              onFocus={() => setShowProductList(true)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {showProductList && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <div
                    key={p.productid}
                    onClick={() => handleSelectProduct(p)}
                    className="cursor-pointer px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <div className="font-medium">{p.productname}</div>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <span>Stock:</span>
                        <span
                          className={
                            p.productstock === 0
                              ? "font-semibold text-red-600"
                              : "font-medium"
                          }
                        >
                          {p.productstock === 0
                            ? "0 (Bajo pedido)"
                            : p.productstock}
                        </span>
                        {p.productstock === 0 && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold text-red-600 rounded-full border border-red-200 bg-red-50">
                            Bajo pedido
                          </span>
                        )}
                      </div>
                      <div className="font-medium">
                        $
                        {Number(p.productpriceofsale ?? 0).toLocaleString(
                          "es-CO",
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {p.productid} | Estado:{" "}
                      {p.isactive ? "Activo" : "Inactivo"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingBackorderProduct && (
              <div className="mt-3 border border-yellow-200 rounded-lg bg-yellow-50 p-3 text-sm text-gray-800">
                <p className="font-medium">
                  Este producto no tiene stock disponible. ¿Desea agregarlo a la
                  cotización como bajo pedido?
                </p>
                <p className="text-xs text-gray-600">
                  {pendingBackorderProduct.productname}
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleBackorderCancel}
                    className="px-3 py-1 rounded border border-yellow-400 bg-white text-yellow-600 hover:bg-yellow-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleBackorderConfirm}
                    className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORMULARIO DE DETALLE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block mb-1 font-medium">Nombre *</label>
            <input
              type="text"
              placeholder="Nombre del producto"
              value={detailForm.name}
              onChange={(e) =>
                setDetailForm({ ...detailForm, name: e.target.value })
              }
              readOnly={!isManualProduct}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Descripción *</label>
            <AutoGrowTextarea
              placeholder="Descripción del producto"
              value={detailForm.description}
              onChange={(e) =>
                setDetailForm({ ...detailForm, description: e.target.value })
              }
              readOnly={!isManualProduct}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Cantidad *</label>
            <input
              type="number"
              min="1"
              value={detailForm.quantity}
              onChange={(e) =>
                setDetailForm({
                  ...detailForm,
                  quantity: Number(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Precio unitario *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={detailForm.unitprice}
              readOnly={!isManualProduct}
              onChange={(e) =>
                setDetailForm({
                  ...detailForm,
                  unitprice: Number(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* INFORMACIÓN DEL PRODUCTO */}
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="text-sm">
            <strong>Tipo:</strong>{" "}
            {isManualProduct ? "Producto manual" : "Producto existente"}
            <br />
            <strong>Disponibilidad:</strong> {detailForm.availability}
            {detailForm.productid && (
              <>
                <br />
                <strong>ID Producto:</strong> {detailForm.productid}
              </>
            )}
            <br />
            <strong>Subtotal:</strong> $
            {(detailForm.quantity * detailForm.unitprice).toLocaleString(
              "es-CO",
            )}
          </div>
        </div>

        {/* BOTÓN AGREGAR */}
        <button
          type="button"
          onClick={handleAddDetail}
          style={{ backgroundColor: Colors.buttons.secondary }}
          className="text-white px-4 py-2 rounded hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Agregar producto
        </button>

        {/* LISTA DE PRODUCTOS AGREGADOS */}
        {form.details.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-bold mb-2">
              Productos agregados ({form.details.length})
            </h4>
            <div className="space-y-3">
              {form.details.map((d, i) => {
                const availabilityLabel =
                  d.isBackorder && d.availability !== "SOLICITAR"
                    ? "BAJO PEDIDO"
                    : d.availability;

                return (
                  <div
                    key={i}
                    className="border rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="font-medium text-gray-800">{d.name}</div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDetail(i)}
                        className="cursor-pointer text-red-500 hover:text-red-700 text-sm focus:outline-none"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Cantidad:</span>

                        <button
                          type="button"
                          onClick={() => changeDetailQuantityBy(i, -1)}
                          className="w-8 h-8 rounded border bg-white hover:bg-gray-50"
                          aria-label="Disminuir cantidad"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min={1}
                          value={d.quantity}
                          onChange={(e) =>
                            updateDetailQuantity(i, Number(e.target.value))
                          }
                          className="w-16 border rounded px-2 py-1 text-center"
                        />

                        <button
                          type="button"
                          onClick={() => changeDetailQuantityBy(i, +1)}
                          className="w-8 h-8 rounded border bg-white hover:bg-gray-50"
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>

                      <div>
                        Precio unitario: ${d.unitprice.toLocaleString("es-CO")}
                      </div>
                      <div>Subtotal: ${d.subtotal.toLocaleString("es-CO")}</div>
                      <div>
                        Tipo:{" "}
                        {d.productid === null
                          ? "Manual (para comprar)"
                          : "Existente"}
                      </div>
                      {d.productid !== null && (
                        <div>ID del producto: {d.productid}</div>
                      )}

                      <div className="flex items-center gap-2">
                        <span>Disponibilidad:</span>
                        <span className="font-semibold text-gray-800">
                          {availabilityLabel}
                        </span>
                      </div>
                    </div>

                    {d.isBackorder && (
                      <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-2 text-xs text-orange-900">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full border border-orange-300 bg-orange-100 font-semibold text-orange-800">
                              Bajo pedido
                            </span>
                            Este producto no tiene stock disponible y se cotiza
                            bajo solicitud.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RESUMEN FINANCIERO */}
        <div className="mt-6 border p-4 rounded-lg bg-gray-50">
          <h3 className="font-bold mb-3">Resumen financiero</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (19%):</span>
              <span>${tax.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>${total.toLocaleString("es-CO")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN GUARDAR */}
      <button
        type="submit"
        style={{ backgroundColor: Colors.buttons.primary }}
        className="cursor-pointer w-full text-white px-4 py-3 rounded font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={!canSubmit}
        title={
          !canSubmit
            ? "Completa tipo de servicio, productos y (si no hay solicitud) los datos del cliente"
            : ""
        }
      >
        Guardar Cotización
      </button>
    </form>
  );
}
