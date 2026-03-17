"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import RequireAuth from "../../auth/requireauth";
import { DataTable } from "../components/datatable/DataTable";
import { Column } from "../components/datatable/types/column.types";
import DownloadXLSXButton from "../components/DownloadXLSXButton";
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
import { showError, showSuccess, showWarning } from "@/shared/utils/notifications";

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

type AuthEntity = {
  customerid?: number | null;
  customer?: {
    customerid?: number | null;
  } | null;
  customers?: Array<{
    customerid?: number | null;
  }> | null;
  technicianid?: number | null;
  technician?: {
    technicianid?: number | null;
  } | null;
  technicians?: Array<{
    technicianid?: number | null;
  }> | null;
  role?: unknown;
  rolename?: unknown;
  roles?: unknown;
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

function useDesktopQuery() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const fn = () => setIsDesktop(mq.matches);
    fn();
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  return isDesktop;
}

function useSidebarWidth(selector = "#app-sidebar") {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    const update = () => setW(el.offsetWidth || 0);
    update();
    let ro: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    }
    const mo = new MutationObserver(update);
    mo.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
    window.addEventListener("resize", update);
    return () => {
      if (ro) {
        try {
          ro.disconnect();
        } catch {}
        ro = null;
      }
      mo.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [selector]);
  return w;
}

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

export default function QuotesIndex() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { canView, canCreate, canUpdate, canDelete, has } = usePermissions();
  const isDesktop = useDesktopQuery();
  const sidebarW = useSidebarWidth("#app-sidebar");
  const canViewQuotes = canView("quotes");
  const canCreateQuotes = canCreate("quotes");
  const canUpdateQuotes = canUpdate("quotes");
  const canDeleteQuotes = canDelete("quotes");
  const canApproveQuotes = has("quotes", "approve");
  const canCompleteQuotes = has("quotes", "complete");
  const canDeactivateQuotes = has("quotes", "deactivate");
  const canCancelQuotes = canUpdateQuotes || canDeactivateQuotes;
  const canExportQuotes = has("quotes", "download_report") || has("quotes", "export");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [quotesData, setQuotesData] = useState<QuoteTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const authUser = useMemo(() => (user ?? {}) as AuthEntity, [user]);
  const authProfile = useMemo(() => (profile ?? {}) as AuthEntity, [profile]);

  const roleName = useMemo(() => extractRoleName(user, profile), [user, profile]);
  const isClientRole = useMemo(
    () => roleName === "cliente" || roleName === "client" || roleName === "customer",
    [roleName],
  );
  const isTechnicianRole = useMemo(
    () => roleName === "tecnico" || roleName === "tecnico(a)" || roleName === "technician",
    [roleName],
  );

  const currentCustomerId = useMemo(
    () =>
      firstPositiveInteger(
        authUser?.customerid,
        authUser?.customer?.customerid,
        authUser?.customers?.[0]?.customerid,
        authProfile?.customerid,
        authProfile?.customer?.customerid,
        authProfile?.customers?.[0]?.customerid,
      ),
    [authProfile, authUser],
  );
  const currentTechnicianId = useMemo(
    () =>
      firstPositiveInteger(
        authUser?.technicianid,
        authUser?.technician?.technicianid,
        authUser?.technicians?.[0]?.technicianid,
        authProfile?.technicianid,
        authProfile?.technician?.technicianid,
        authProfile?.technicians?.[0]?.technicianid,
      ),
    [authProfile, authUser],
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
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getQuotes({
        page,
        limit,
        search,
        customerid: isClientRole ? currentCustomerId ?? undefined : undefined,
        technicianid: isTechnicianRole ? currentTechnicianId ?? undefined : undefined,
      });
      const allQuotes: QuoteListItem[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const mapped: QuoteTableRow[] = allQuotes.map((q: QuoteListItem) => {
        const rawStatus = q.state?.name ?? "";
        const clientName = resolveClientName(q);
        const requestId = resolveRequestId(q);
        const technicianName = `${q.technician?.users?.name ?? ""} ${q.technician?.users?.lastname ?? ""}`.trim() || "Sin tecnico";
        const details = Array.isArray(q.details) ? q.details : [];
        const itemsSummary = details
          .map((detail) => String(detail?.description ?? "").trim())
          .filter(Boolean)
          .join(", ");

        return {
          id: q.quotesid,
          requestRef: requestId ? `#${requestId}` : "Directa",
          client: clientName,
          technician: technicianName,
          serviceType: String(q.servicetype ?? "Sin tipo"),
          itemsSummary: itemsSummary || "Sin items",
          status: rawStatus,
          statusSearch: normalizeQuoteStatusText(rawStatus),
          creationDate: String(q.createdat ?? ""),
          amount: Number(q.total ?? 0),
          detailsCount: details.length,
          raw: q,
        };
      });

      setQuotesData(mapped);
      setTotal(Array.isArray(response) ? mapped.length : response.meta?.total ?? mapped.length);
      setTotalPages(Array.isArray(response) ? 1 : response.meta?.totalPages ?? 1);
    } catch {
      setQuotesData([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    canViewQuotes,
    currentCustomerId,
    currentTechnicianId,
    isClientRole,
    isTechnicianRole,
    limit,
    page,
    search,
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

  const xlsxRows = useMemo(() => {
    return [...quotesData]
      .sort((a, b) => b.id - a.id)
      .map((row) => ({
        Id: row.id,
        Solicitud: row.requestRef,
        Cliente: row.client,
        Tecnico: row.technician,
        "Tipo de servicio": row.serviceType,
        Items: row.itemsSummary,
        Estado: normalizeQuoteStatus(row.status).label,
        Fecha: row.creationDate
          ? new Date(row.creationDate).toLocaleDateString("es-CO")
          : "",
        Total: row.amount ?? 0,
      }));
  }, [quotesData]);

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
      <div className="relative" style={{ paddingLeft: isDesktop ? sidebarW : 0 }}>
        <main className="min-h-[100dvh] bg-gray-100 relative">
          {!canViewQuotes ? (
            <div className="flex-1 flex items-center justify-center p-8">
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
            serverPagination={{
              page,
              limit,
              totalPages,
              onPageChange: setPage,
              onPageSizeChange: (nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              },
            }}
            serverSearch={{
              value: search,
              onChange: (value) => {
                setSearch(value);
                setPage(1);
              },
            }}
            searchPlaceholder="Buscar cotizaciones"
            searchableKeys={[
              "id",
              "requestRef",
              "client",
              "statusSearch",
              "amount",
              "creationDate",
            ]}
            pageSize={5}
            disableInternalScroll
            onView={(row) => router.push(`/dashboard/quotes/${row.id}`)}
            onCreate={canCreateQuotes ? () => router.push("/dashboard/quotes/register") : undefined}
            createButtonText="Crear Cotización"
            onCheck={canApproveQuotes ? handleApproveQuote : undefined}
            onCancel={canCancelQuotes ? handleCancelQuote : undefined}
            onDelete={canDeleteQuotes ? handleRevokeQuote : undefined}
            rightActions={
              canExportQuotes ? (
                <>
                  <div className="hidden">
                    <DownloadXLSXButton
                      id="download-excel-btn-quotes"
                      data={xlsxRows as unknown as Record<string, unknown>[]}
                      fileName="reporte_cotizaciones.xlsx"
                      headers={[
                        "Id",
                        "Solicitud",
                        "Cliente",
                        "Tecnico",
                        "Tipo de servicio",
                        "Items",
                        "Estado",
                        "Fecha",
                        "Total",
                      ]}
                      excludeKeys={[]}
                    />
                  </div>
                  <button
                    type="button"
                    className="relative cursor-pointer inline-flex h-9 items-center gap-2 overflow-hidden rounded-md px-4 text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 group"
                    style={{ background: Colors.buttons.primary }}
                    onClick={() =>
                      document
                        .querySelector<HTMLButtonElement>("#download-excel-btn-quotes")
                        ?.click()
                    }
                  >
                    <span className="absolute inset-0 bg-[#227a69] scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                    <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                      <Image src="/icons/download.svg" alt="Descargar" width={16} height={16} />
                      Descargar Reporte
                    </span>
                  </button>
                </>
              ) : null
            }
          />
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
