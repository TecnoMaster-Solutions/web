"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import RequireAuth from "../../auth/requireauth";
import { DataTable } from "../components/datatable/DataTable";
import { Column } from "../components/datatable/types/column.types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { useAuth } from "@/features/auth/authcontext";

import {
  getQuotes,
  approveQuote,
  completeQuote,
  cancelQuote,
  revokeQuote,
  assignCustomerToQuote,
} from "./api/quotes.api";
import { api } from "@/shared/utils/apiClient";

import { QuoteTableRow } from "./types/Quote.type";
import Colors from "@/shared/theme/colors";
import { showError, showInfo, showSuccess, showWarning } from "@/shared/utils/notifications";

type QuoteStatusConfig = {
  label: string;
  className: string;
  style?: React.CSSProperties;
};

type QuoteDetailLike = {
  description?: string;
  quantity?: number;
};

type QuoteListItem = {
  quotesid: number;
  technicianid?: number | null;
  customerid?: number | null;
  serviceRequestId?: number | null;
  servicetype?: string | null;
  total?: number | null;
  createdat?: string;
  details?: QuoteDetailLike[];
  state?: { name?: string };
  customer?: {
    customerid?: number | null;
    userid?: number | null;
    users?: { name?: string; lastname?: string };
  };
  technician?: {
    technicianid?: number | null;
    userid?: number | null;
    users?: { name?: string; lastname?: string };
  };
  serviceRequest?: {
    serviceRequestId?: number;
    id?: number;
    customerid?: number | null;
    clientId?: number | null;
    customer?: {
      customerid?: number | null;
      userid?: number | null;
      users?: { name?: string; lastname?: string };
    };
    techniciansMap?: Array<{
      technicianid?: number | null;
      technician?: {
        technicianid?: number | null;
        userid?: number | null;
        users?: { name?: string; lastname?: string };
      };
    }>;
  };
};

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

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const maybeResponse = (error as { response?: { data?: { message?: string } } }).response;
    const backendMessage = maybeResponse?.data?.message;
    if (backendMessage) return backendMessage;
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) return maybeMessage;
  }
  return fallback;
};

const normalizeQuoteStatus = (status?: string): QuoteStatusConfig => {
  if (!status) return { label: "—", className: "text-slate-500" };

  const value = String(status).toLowerCase();

  if (value.includes("pend")) {
    return { label: "Pendiente", className: "", style: { color: Colors.states.pending } };
  }

  if (value.includes("aprob") || value.includes("approved")) {
    return { label: "Aprobada", className: "", style: { color: Colors.states.success } };
  }

  if (value.includes("finish") || value.includes("finaliz") || value.includes("complet")) {
    return { label: "Completada", className: "", style: { color: Colors.states.completed } };
  }

  if (value.includes("cancel")) {
    return { label: "Cancelada", className: "text-gray-600" };
  }

  if (value.includes("revoke") || value.includes("anul")) {
    return { label: "Anulada", className: "", style: { color: Colors.states.nullable } };
  }

  return { label: status, className: "text-slate-500" };
};

const normalizeQuoteStatusText = (status?: string): string => {
  if (!status) return "";
  const value = String(status).toLowerCase();

  if (value.includes("pend")) return "pendiente";
  if (value.includes("aprob") || value.includes("approved")) return "aprobada";
  if (value.includes("finish") || value.includes("finaliz") || value.includes("complet")) return "completada";
  if (value.includes("cancel")) return "cancelada";
  if (value.includes("revoke") || value.includes("anul")) return "anulada";

  return value;
};

const resolveRequestId = (q: QuoteListItem): number | null => {
  const fromNested = Number(q.serviceRequest?.serviceRequestId ?? q.serviceRequest?.id);
  if (Number.isFinite(fromNested) && fromNested > 0) return fromNested;
  const fromFlat = Number(q.serviceRequestId);
  if (Number.isFinite(fromFlat) && fromFlat > 0) return fromFlat;
  return null;
};

const resolveClientName = (q: QuoteListItem): string => {
  const fromQuote = `${q.customer?.users?.name ?? ""} ${q.customer?.users?.lastname ?? ""}`.trim();
  if (fromQuote) return fromQuote;
  const fromRequest = `${q.serviceRequest?.customer?.users?.name ?? ""} ${q.serviceRequest?.customer?.users?.lastname ?? ""}`.trim();
  if (fromRequest) return fromRequest;
  return "Sin cliente";
};

const normalizeText = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toPositiveInteger = (value: unknown): number | null => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const integer = Math.trunc(numeric);
  return integer > 0 ? integer : null;
};

const firstPositiveInteger = (...values: unknown[]): number | null => {
  for (const value of values) {
    const id = toPositiveInteger(value);
    if (id) return id;
  }
  return null;
};

const extractRoleName = (user: unknown, profile: unknown): string => {
  const userObj = (user ?? {}) as Record<string, unknown>;
  const profileObj = (profile ?? {}) as Record<string, unknown>;
  const userRole = userObj.role as Record<string, unknown> | undefined;
  const profileRole = profileObj.role as Record<string, unknown> | undefined;
  const profileRoles = profileObj.roles as Record<string, unknown> | undefined;

  return (
    [
      userObj.rolename,
      userObj.role,
      userRole?.name,
      profileObj.rolename,
      profileObj.role,
      profileRole?.name,
      profileRoles?.name,
    ]
      .map((item) => normalizeText(String(item ?? "")))
      .find(Boolean) ?? ""
  );
};

const quoteBelongsToCustomer = (
  quote: QuoteListItem,
  customerId: number | null,
  userId: number | null,
): boolean => {
  if (!customerId && !userId) return false;

  const quoteCustomerId = firstPositiveInteger(
    quote.customerid,
    quote.customer?.customerid,
    quote.serviceRequest?.customerid,
    quote.serviceRequest?.clientId,
  );
  if (customerId && quoteCustomerId && quoteCustomerId === customerId) return true;

  const quoteCustomerUserId = firstPositiveInteger(
    quote.customer?.userid,
    quote.serviceRequest?.customer?.userid,
  );
  if (userId && quoteCustomerUserId && quoteCustomerUserId === userId) return true;

  return false;
};

const quoteBelongsToTechnician = (
  quote: QuoteListItem,
  technicianId: number | null,
  userId: number | null,
): boolean => {
  if (!technicianId && !userId) return false;

  const quoteTechnicianIds = [
    firstPositiveInteger(quote.technicianid, quote.technician?.technicianid),
    ...(quote.serviceRequest?.techniciansMap ?? []).map((mapItem) =>
      firstPositiveInteger(mapItem?.technicianid, mapItem?.technician?.technicianid),
    ),
  ].filter((id): id is number => Boolean(id));

  if (technicianId && quoteTechnicianIds.includes(technicianId)) return true;

  const quoteTechnicianUserIds = [
    firstPositiveInteger(quote.technician?.userid),
    ...(quote.serviceRequest?.techniciansMap ?? []).map((mapItem) =>
      firstPositiveInteger(mapItem?.technician?.userid),
    ),
  ].filter((id): id is number => Boolean(id));

  if (userId && quoteTechnicianUserIds.includes(userId)) return true;

  return false;
};

export default function QuotesIndex() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { canView, canCreate, canUpdate, canDelete, has } = usePermissions();
  const canViewQuotes = canView("quotes");
  const canCreateQuotes = canCreate("quotes");
  const canUpdateQuotes = canUpdate("quotes");
  const canDeleteQuotes = canDelete("quotes");
  const canApproveQuotes = has("quotes", "approve");
  const canCompleteQuotes = has("quotes", "complete");
  const canDeactivateQuotes = has("quotes", "deactivate");
  const canCancelQuotes = canUpdateQuotes || canDeactivateQuotes;
  const canExportQuotes = has("quotes", "download_report") || has("quotes", "export");
  const [quotesData, setQuotesData] = useState<QuoteTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  const roleName = useMemo(() => extractRoleName(user, profile), [user, profile]);
  const isClientRole = useMemo(
    () => roleName === "cliente" || roleName === "client" || roleName === "customer",
    [roleName],
  );
  const isTechnicianRole = useMemo(
    () => roleName === "tecnico" || roleName === "tecnico(a)" || roleName === "technician",
    [roleName],
  );

  const currentUserId = useMemo(
    () => firstPositiveInteger(user?.userid, profile?.userid, profile?.users?.userid),
    [user, profile],
  );
  const currentCustomerId = useMemo(
    () =>
      firstPositiveInteger(
        user?.customerid,
        user?.customer?.customerid,
        user?.customers?.[0]?.customerid,
        profile?.customerid,
        profile?.customer?.customerid,
        profile?.customers?.[0]?.customerid,
      ),
    [user, profile],
  );
  const currentTechnicianId = useMemo(
    () =>
      firstPositiveInteger(
        user?.technicianid,
        user?.technician?.technicianid,
        user?.technicians?.[0]?.technicianid,
        profile?.technicianid,
        profile?.technician?.technicianid,
        profile?.technicians?.[0]?.technicianid,
      ),
    [user, profile],
  );

  const createCustomerAndAssignToQuote = useCallback(
    async (quoteId: number, form: NewClientForm) => {
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
        (d) => normalizeText(d.name) === normalizeText(form.tipo),
      );
      if (!selectedDocType) {
        throw new Error(`No se encontró el tipo de documento ${form.tipo}`);
      }

      const clientRole = roles.find(
        (r) => normalizeText(r.name) === "cliente",
      );
      if (!clientRole) {
        throw new Error("No se encontró el rol Cliente");
      }

      const userPayload = {
        name: form.nombre.trim(),
        lastname: (form.apellido ?? "").trim(),
        email: form.correo.trim(),
        phone: form.telefono.replace(/\D/g, ""),
        typeid: selectedDocType.typeofdocumentid,
        stateid: 1,
        roleid: clientRole.roleid,
        documentnumber: form.documento.trim(),
        customercity: "",
        customerzipcode: "",
        image: "",
      };

      const createdUserRes = await api.post("/users", userPayload);
      const userId = Number(
        createdUserRes?.data?.data?.userid ?? createdUserRes?.data?.userid,
      );
      if (!userId) throw new Error("No se pudo obtener el usuario creado");

      const customerRes = await api.get(`/customers/user/${userId}`);
      const customerId = Number(
        customerRes?.data?.customerid ?? customerRes?.data?.data?.customerid,
      );
      if (!customerId) throw new Error("No se pudo obtener el cliente creado");

      await assignCustomerToQuote(quoteId, customerId);
    },
    [],
  );

  const ensureQuoteHasCustomer = useCallback(
    async (row: QuoteTableRow): Promise<boolean> => {
      const raw = row.raw as QuoteListItem | undefined;
      const hasCustomer = Boolean(raw?.customerid || raw?.customer?.users);
      if (hasCustomer) return true;

      const { value: formValues } = await Swal.fire({
        title: "Crear cliente para aprobar",
        html: `
          <div style="display:grid;gap:8px;text-align:left;">
            <select id="swal_tipo" class="swal2-input">
              <option value="CC">CC</option>
              <option value="TI">TI</option>
              <option value="CE">CE</option>
              <option value="NIT">NIT</option>
              <option value="PASAPORTE">PASAPORTE</option>
            </select>
            <input id="swal_documento" class="swal2-input" placeholder="Documento" />
            <input id="swal_nombre" class="swal2-input" placeholder="Nombre" />
            <input id="swal_apellido" class="swal2-input" placeholder="Apellido (opcional)" />
            <input id="swal_telefono" class="swal2-input" placeholder="Teléfono" />
            <input id="swal_correo" class="swal2-input" placeholder="Correo" type="email" />
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Crear cliente",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const tipo = (
            document.getElementById("swal_tipo") as HTMLSelectElement | null
          )?.value?.trim();
          const documento = (
            document.getElementById("swal_documento") as HTMLInputElement | null
          )?.value?.trim();
          const nombre = (
            document.getElementById("swal_nombre") as HTMLInputElement | null
          )?.value?.trim();
          const apellido = (
            document.getElementById("swal_apellido") as HTMLInputElement | null
          )?.value?.trim();
          const telefono = (
            document.getElementById("swal_telefono") as HTMLInputElement | null
          )?.value?.trim();
          const correo = (
            document.getElementById("swal_correo") as HTMLInputElement | null
          )?.value?.trim();

          if (!tipo || !documento || !nombre || !telefono || !correo) {
            Swal.showValidationMessage(
              "Documento, nombre, teléfono y correo son obligatorios.",
            );
            return;
          }

          return {
            tipo,
            documento,
            nombre,
            apellido,
            telefono,
            correo,
          } as NewClientForm;
        },
      });

      if (!formValues) return false;

      try {
        await createCustomerAndAssignToQuote(row.id, formValues as NewClientForm);
        showSuccess("Se creó y asoció el cliente a la cotización.");
        return true;
      } catch (error: unknown) {
        showError(getErrorMessage(error, "No se pudo crear/asociar el cliente."));
        return false;
      }
    },
    [createCustomerAndAssignToQuote],
  );

  const fetchQuotes = useCallback(async () => {
    if (!canViewQuotes) {
      setQuotesData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getQuotes();
      const allQuotes: QuoteListItem[] = Array.isArray(data) ? data : [];
      const filteredQuotes = allQuotes.filter((quote) => {
        if (isClientRole) {
          return quoteBelongsToCustomer(quote, currentCustomerId, currentUserId);
        }
        if (isTechnicianRole) {
          return quoteBelongsToTechnician(quote, currentTechnicianId, currentUserId);
        }
        return true;
      });

      const mapped: QuoteTableRow[] = filteredQuotes.map((q: QuoteListItem) => {
        const rawStatus = q.state?.name ?? "";
        const clientName = resolveClientName(q);
        const requestId = resolveRequestId(q);

        return {
          id: q.quotesid,
          requestRef: requestId ? `#${requestId}` : "Directa",
          client: clientName,
          status: rawStatus,
          statusSearch: normalizeQuoteStatusText(rawStatus),
          creationDate: q.createdat,
          amount: Number(q.total ?? 0),
          raw: q,
        };
      });

      setQuotesData(mapped);
    } finally {
      setLoading(false);
    }
  }, [
    canViewQuotes,
    currentCustomerId,
    currentTechnicianId,
    currentUserId,
    isClientRole,
    isTechnicianRole,
  ]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const columns: Column<QuoteTableRow>[] = [
    { key: "id", header: "ID" },
    { key: "requestRef", header: "Solicitud" },
    { key: "client", header: "Cliente" },
    {
      key: "creationDate",
      header: "Fecha",
      render: (row) => {
        const d = row.creationDate ? new Date(row.creationDate) : null;
        return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("es-CO") : "—";
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => {
        const config = normalizeQuoteStatus(row.status);
        return (
          <span className={config.className} style={config.style}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Total",
      render: (row) =>
        Number(row.amount ?? 0).toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
        }),
    },
  ];

  const handleApproveQuote = useCallback(async (row: QuoteTableRow) => {
    if (!canApproveQuotes) {
      showWarning("No tienes permisos para aprobar cotizaciones.");
      return;
    }

    const r = await Swal.fire({
      title: "¿Aprobar cotización?",
      text: `Total: ${Number(row.amount ?? 0).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      })}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
    });

    if (!r.isConfirmed) return;

    const customerReady = await ensureQuoteHasCustomer(row);
    if (!customerReady) return;

    try {
      await approveQuote(row.id);
    } catch (error: unknown) {
      showError(getErrorMessage(error, "No se pudo aprobar la cotización."));
      return;
    }

    await fetchQuotes();

    if (!canCompleteQuotes) {
      showSuccess("La cotización quedó aprobada.");
      return;
    }

    let completionResult: { sale?: { salecode?: string; saleid?: number } } | null = null;
    try {
      completionResult = await completeQuote(row.id);
    } catch {
      await fetchQuotes();
      showWarning("La cotización quedó en estado aprobada, pero no se pudo generar la venta.");
      return;
    }

    await fetchQuotes();

    showSuccess(
      completionResult?.sale
        ? `Venta generada: ${completionResult.sale.salecode ?? completionResult.sale.saleid}`
        : "La cotización se completó y se creó la venta asociada."
    );
  }, [canApproveQuotes, canCompleteQuotes, ensureQuoteHasCustomer, fetchQuotes]);

  const handleCancelQuote = async (row: QuoteTableRow) => {
    if (!canCancelQuotes) {
      showWarning("No tienes permisos para cancelar cotizaciones.");
      return;
    }

    const r = await Swal.fire({
      title: "Cancelar cotización?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
      confirmButtonColor: "#058a3c",
    });

    if (!r.isConfirmed) return;

    try {
      await cancelQuote(row.id);
      await fetchQuotes();
      showSuccess("Cotización cancelada");
    } catch (error: unknown) {
      showError(getErrorMessage(error, "No se pudo cancelar la cotización."));
    }
  };

  const handleRevokeQuote = async (row: QuoteTableRow) => {
    if (!canDeleteQuotes) {
      showWarning("No tienes permisos para anular cotizaciones.");
      return;
    }

    const status = row.statusSearch;

    if (status !== "aprobada") {
      showWarning("Solo se pueden anular cotizaciones que estén aprobadas.");
      return;
    }

    const r = await Swal.fire({
      title: "¿Anular cotización?",
      input: "textarea",
      inputLabel: "Observación (opcional)",
      inputPlaceholder: "Motivo de la anulación",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Anular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b20000",
    });

    if (!r.isConfirmed) return;

    try {
      await revokeQuote(row.id, r.value);
      await fetchQuotes();
      showSuccess("La cotización fue anulada correctamente.");
    } catch (error: unknown) {
      showError(getErrorMessage(error, "No se pudo anular la cotización."));
    }
  };

  return (
    <RequireAuth>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Listado de Cotizaciones</h1>

        {!canViewQuotes ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-gray-500">
              No tienes permisos para visualizar cotizaciones.
            </span>
          </div>
        ) : (

        <DataTable<QuoteTableRow>
          module="quotes"
          data={quotesData}
          columns={columns}
          loading={loading}
          searchableKeys={[
            "id",
            "requestRef",
            "client",
            "statusSearch",
            "amount",
            "creationDate",
          ]}
          pageSize={8}
          onView={(row) => router.push(`/dashboard/quotes/${row.id}`)}
          onCreate={canCreateQuotes ? () => router.push("/dashboard/quotes/register") : undefined}
          createButtonText="Crear Cotización"
          onCheck={canApproveQuotes ? handleApproveQuote : undefined}
          onCancel={canCancelQuotes ? handleCancelQuote : undefined}
          onDelete={canDeleteQuotes ? handleRevokeQuote : undefined}
          rightActions={
            canExportQuotes ? (
            <button
              type="button"
              className="relative cursor-pointer inline-flex h-9 items-center gap-2 overflow-hidden rounded-md px-4 text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 group"
              style={{ background: Colors.buttons.primary }}
              onClick={() => showInfo("Conecta aquí la descarga del reporte.")}
            >
              <span className="absolute inset-0 bg-[#227a69] scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                <Image src="/icons/download.svg" alt="Descargar" width={16} height={16} />
                Descargar Reporte
              </span>
            </button>
            ) : null
          }
        />
        )}
      </div>
    </RequireAuth>
  );
}
