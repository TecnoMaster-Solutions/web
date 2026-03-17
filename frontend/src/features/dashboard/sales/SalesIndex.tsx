"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";
import Modal from "@/features/dashboard/components/Modal";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Colors from "@/shared/theme/colors";
import { ISale, ISalesPaginatedResult } from "./types/Sales.type";
import { getSales, annulSale } from "./services/sales.service";
import { getSales as getAllSales } from "./api/sales.api";
import CreateSaleForm from "./components/CreateSaleForm";
import SalePaymentsModal from "./components/SalePaymentsModal";
import { useAuth } from "@/features/auth/authcontext";

type AuthRecord = {
  rolename?: string;
  role?: { name?: string } | null;
  users?: { rolename?: string } | null;
  customerid?: number;
  clientid?: number;
  clientId?: number;
  customer?: { customerid?: number; id?: number } | null;
  customers?: Array<{ customerid?: number; id?: number }> | null;
};

type JwtPayload = {
  permissions?: unknown[];
};

type ApiErrorLike = {
  name?: string;
  code?: string;
  response?: { data?: { message?: string } };
  message?: string;
};

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function normalizeRoleName(role: unknown) {
  return String(role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toPositiveId(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractAuthClientId(user: AuthRecord | null, profile: AuthRecord | null): number | null {
  const candidates = [
    user?.customerid,
    user?.clientid,
    user?.clientId,
    user?.customer?.customerid,
    user?.customers?.[0]?.customerid,
    user?.customer?.id,
    user?.customers?.[0]?.id,
    profile?.customerid,
    profile?.clientid,
    profile?.clientId,
    profile?.customer?.customerid,
    profile?.customers?.[0]?.customerid,
    profile?.customer?.id,
    profile?.customers?.[0]?.id,
  ];

  for (const candidate of candidates) {
    const id = toPositiveId(candidate);
    if (id) return id;
  }

  return null;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

type SaleRow = {
  id: number;
  codigo: string;
  cliente: string;
  fecha: string;
  fechaISO: string;
  total: number;
  estado: string;
  estadoPago: string;
  paidAmount: number;
  paymentMethod: string;
};

function getPaymentStatusLabel(status: ISale["paymentstatus"]) {
  if (status === "Pagada") return "Pagada";
  if (status === "Abonada") return "Abonada";
  return "Pendiente";
}

function isGatewayPaymentMethod(method?: string | null) {
  const normalized = String(method ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return normalized === "pasarela de pago";
}

export default function SalesIndex() {
  const [pageSize, setPageSize] = useState(5);
  const SEARCH_DEBOUNCE_MS = 300;

  const router = useRouter();
  const { user, profile } = useAuth();
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [tokenPermissions, setTokenPermissions] = useState<string[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [paymentSaleId, setPaymentSaleId] = useState<number | null>(null);

  const [isAnnulModalOpen, setAnnulModalOpen] = useState(false);
  const [saleToAnnul, setSaleToAnnul] = useState<SaleRow | null>(null);
  const [annulReason, setAnnulReason] = useState("");
  const [annulling, setAnnulling] = useState(false);

  const pageAbortRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const pageSizeRef = useRef(pageSize);

  useEffect(() => {
    pageSizeRef.current = pageSize;
  }, [pageSize]);

  const authRole = normalizeRoleName(
    (user as AuthRecord | null)?.rolename ??
    (profile as AuthRecord | null)?.rolename ??
    (profile as AuthRecord | null)?.role?.name ??
    (profile as AuthRecord | null)?.users?.rolename
  );
  const authClientId = extractAuthClientId(
    user as AuthRecord | null,
    profile as AuthRecord | null
  );
  const isClientUser = authRole.includes("cliente");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawToken = localStorage.getItem("accessToken") ?? localStorage.getItem("token");

    if (!rawToken) {
      setTokenPermissions([]);
      setPermissionsLoaded(true);
      return;
    }

    const payload = decodeJwtPayload(rawToken);
    const permissions = Array.isArray(payload?.permissions)
      ? payload.permissions.filter((p: unknown): p is string => typeof p === "string")
      : [];

    setTokenPermissions(permissions);
    setPermissionsLoaded(true);
  }, []);

  const hasSalesRead = tokenPermissions.includes("sales.read");
  const hasSalesCreate = tokenPermissions.includes("sales.create");
  const hasSalesManagePayment = tokenPermissions.includes("sales.manage_payment");
  const hasSalesDelete = tokenPermissions.includes("sales.delete");
  const hasSalesDeactivate = tokenPermissions.includes("sales.deactivate");
  const hasSalesExport =
    tokenPermissions.includes("sales.export") ||
    tokenPermissions.includes("sales.download_report");
  const hasSalesCancel =
    tokenPermissions.includes("sales.cancel") || hasSalesDeactivate || hasSalesDelete;
  const canOpenPaymentFlow = hasSalesManagePayment || isClientUser;

  const mapSalesToRows = useCallback(
    (data: ISale[]): SaleRow[] => {
      const visibleSales =
        isClientUser && authClientId
          ? data.filter((sale) => Number(sale.customerid) === authClientId)
          : data;

      return visibleSales.map((sale) => ({
        id: sale.saleid,
        codigo: sale.salecode,
        cliente: sale.customer?.users
          ? `${sale.customer.users.name} ${sale.customer.users.lastname}`
          : `Cliente #${sale.customerid}`,
        fechaISO: sale.saledate,
        fecha: new Date(sale.saledate).toLocaleDateString("es-CO"),
        total: sale.totalamount,
        estado:
          sale.paymentstatus === "Pagada" || sale.salestatus === "Completed"
            ? "Finalizada"
            : sale.salestatus === "Cancelled"
              ? "Anulada"
              : sale.salestatus === "Pending"
                ? "Pendiente"
                : sale.salestatus,
        estadoPago: isGatewayPaymentMethod(sale.paymentmethod)
          ? "Pagada"
          : getPaymentStatusLabel(sale.paymentstatus),
        paidAmount: Number(sale.paidamount ?? 0),
        paymentMethod: sale.paymentmethod ?? "",
      }));
    },
    [authClientId, isClientUser]
  );

  const loadSalesPage = useCallback(
    async (targetPage: number, searchText: string, signal?: AbortSignal, limitOverride?: number) => {
      const effectiveLimit = limitOverride ?? pageSizeRef.current;
      const response = (await getSales({
        page: targetPage,
        limit: effectiveLimit,
        search: searchText,
        signal,
      })) as ISalesPaginatedResult;

      const list = Array.isArray(response?.data) ? response.data : [];
      const meta = response?.meta;

      const rows = mapSalesToRows(list);
      // Ordenar por ID descendente como respaldo
      rows.sort((a, b) => b.id - a.id);
      setSales(rows);
      setCurrentPage(Number(meta?.page ?? targetPage));
      setTotalPages(Math.max(1, Number(meta?.totalPages ?? 1)));

      return { list, meta };
    },
    [mapSalesToRows] // sin pageSize — se usa pageSizeRef
  );

  const closePaymentModal = useCallback(() => {
    setPaymentSaleId(null);
  }, []);

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      pageAbortRef.current?.abort();
      const controller = new AbortController();
      pageAbortRef.current = controller;

      setLoading(true);
      try {
        await loadSalesPage(nextPage, search, controller.signal);
      } catch (error: unknown) {
        const apiError = error as ApiErrorLike | null;
        if (apiError?.name === "CanceledError" || apiError?.code === "ERR_CANCELED") {
          return;
        }
        console.error(error);
        showError("Error al cargar la página de ventas.");
      } finally {
        setLoading(false);
      }
    },
    [loadSalesPage, search]
  );

  const handlePageSizeChange = useCallback(
    async (newPageSize: number) => {
      setPageSize(newPageSize);
      pageAbortRef.current?.abort();
      const controller = new AbortController();
      pageAbortRef.current = controller;

      setLoading(true);
      try {
        await loadSalesPage(1, search, controller.signal, newPageSize);
      } catch (error: unknown) {
        const apiError = error as ApiErrorLike | null;
        if (apiError?.name === "CanceledError" || apiError?.code === "ERR_CANCELED") {
          return;
        }
        console.error(error);
        showError("Error al cambiar el tamaño de página.");
      } finally {
        setLoading(false);
      }
    },
    [loadSalesPage, search]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  useEffect(() => {
    if (!permissionsLoaded) return;

    if (!hasSalesRead) {
      setInitialLoading(false);
      return;
    }

    const load = async () => {
      setInitialLoading(true);
      setLoading(true);
      try {
        await loadSalesPage(1, "");
      } catch (error) {
        console.error(error);
        showError("Error al cargar las ventas.");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    void load();
  }, [hasSalesRead, loadSalesPage, permissionsLoaded]);

  useEffect(() => {
    if (!permissionsLoaded || !hasSalesRead) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setLoading(true);
      void loadSalesPage(1, search, controller.signal)
        .catch((error: unknown) => {
          const apiError = error as ApiErrorLike | null;
          if (apiError?.name === "CanceledError" || apiError?.code === "ERR_CANCELED") {
            return;
          }
          console.error(error);
          showError("Error al buscar ventas.");
        })
        .finally(() => {
          setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      searchAbortRef.current?.abort();
    };
  }, [SEARCH_DEBOUNCE_MS, hasSalesRead, loadSalesPage, permissionsLoaded, search]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      pageAbortRef.current?.abort();
      searchAbortRef.current?.abort();
    };
  }, []);

  const exportToExcel = async () => {
    try {
      // Obtener todos los registros directamente de la API
      const allSales = await getAllSales();
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Ventas");

      worksheet.columns = [
        { header: "ID", key: "id", width: 12 },
        { header: "Codigo", key: "codigo", width: 20 },
        { header: "Cliente", key: "cliente", width: 32 },
        { header: "Fecha", key: "fecha", width: 16 },
        { header: "Total", key: "total", width: 18 },
        { header: "Estado", key: "estado", width: 18 },
        { header: "Estado Pago", key: "estadoPago", width: 18 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDC2626" },
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
        cell.alignment = { horizontal: "center" };
      });

      // Transformar los datos para el Excel
      const salesData = allSales.map((sale: any) => {
        const isGatewayPaymentMethod = (method: string) =>
          method === "MercadoPago" || method === "PlaceToPay" || method === "Wompi";
        return {
          id: sale.saleid,
          codigo: sale.salecode,
          cliente: sale.customer?.users?.name
            ? `${sale.customer.users.name} ${sale.customer.users.lastname || ""}`
            : sale.customer?.customername || "",
          fecha: sale.saledate
            ? new Date(sale.saledate).toLocaleDateString("es-CO")
            : "",
          total: sale.totalamount,
          estado:
            sale.paymentstatus === "Pagada" || sale.salestatus === "Completed"
              ? "Finalizada"
              : sale.salestatus === "Cancelled"
                ? "Anulada"
                : sale.salestatus === "Pending"
                  ? "Pendiente"
                  : sale.salestatus,
          estadoPago: isGatewayPaymentMethod(sale.paymentmethod)
            ? sale.paymentstatus
            : sale.paymentstatus,
        };
      });

      salesData.forEach((sale) => {
        worksheet.addRow({
          id: sale.id,
          codigo: sale.codigo,
          cliente: sale.cliente,
          fecha: sale.fecha,
          total: sale.total,
          estado: sale.estado,
          estadoPago: sale.estadoPago,
        });
      });

      worksheet.getColumn("total").numFmt = '"$"#,##0.00';

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar ventas:", error);
      showError("Error al exportar las ventas. Por favor intente de nuevo.");
    }
  };

  const handleOpenAnnul = (row: SaleRow) => {
    if (!hasSalesCancel) {
      showError("No tienes permisos para anular ventas.");
      return;
    }

    if (row.paidAmount > 0) {
      showError("No se puede anular una venta con pagos registrados.");
      return;
    }

    setSaleToAnnul(row);
    setAnnulReason("");
    setAnnulModalOpen(true);
  };

  const handleConfirmAnnul = async () => {
    if (!saleToAnnul) return;
    if (!annulReason.trim()) {
      showError("Debe ingresar un motivo para la anulacion.");
      return;
    }

    setAnnulling(true);
    try {
      await annulSale(saleToAnnul.id, annulReason, "Admin");
      showSuccess(`Venta ${saleToAnnul.codigo} anulada correctamente.`);
      setAnnulModalOpen(false);
      await loadSalesPage(currentPage, search);
    } catch (error) {
      console.error(error);
      showError("Error al anular la venta.");
    } finally {
      setAnnulling(false);
    }
  };

  const columns: Column<SaleRow>[] = [
    {
      key: "id",
      header: "ID",
      render: (row) => row.id.toString(),
    },
    { key: "codigo", header: "Codigo Venta" },
    { key: "cliente", header: "Cliente" },
    { key: "fecha", header: "Fecha" },
    {
      key: "total",
      header: "Total",
      render: (row) => `$${row.total.toLocaleString("es-CO")}`,
    },
    {
      key: "estado",
      header: "Estado",
      render: (row) => {
        let bgColor = "#f3f4f6";
        let textColor = Colors.states.inactive;

        if (row.estado === "Finalizada") {
          bgColor = "#e8f5e8";
          textColor = Colors.states.success;
        } else if (row.estado === "Pendiente") {
          bgColor = "#fff7ed";
          textColor = "#c2410c";
        } else if (row.estado === "Anulada") {
          bgColor = "#fef2f2";
          textColor = "#ef4444";
        }

        return (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {row.estado}
          </span>
        );
      },
    },
    {
      key: "estadoPago",
      header: "Estado Pago",
      render: (row) => {
        const classes =
          row.estadoPago === "Pagada"
            ? "bg-green-100 text-green-700"
            : row.estadoPago === "Abonada"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600";

        return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>{row.estadoPago}</span>;
      },
    },
  ];

  if (!permissionsLoaded || (initialLoading && hasSalesRead)) {
    return <Loader />;
  }

  if (!hasSalesRead) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-500">No tienes permisos para visualizar ventas.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ToastContainer position="bottom-right" />

      {isCreateModalOpen ? (
        <div className="w-full max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          <CreateSaleForm
            onClose={() => setCreateModalOpen(false)}
            onSaved={async () => {
              await loadSalesPage(currentPage, search);
            }}
          />
        </div>
      ) : (
        <DataTable<SaleRow>
          data={sales}
          columns={columns}
          searchableKeys={["id", "codigo", "cliente", "fecha", "total", "estado", "estadoPago"]}
          pageSize={pageSize}
          serverPagination={{
            page: currentPage,
            limit: pageSize,
            totalPages,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          serverSearch={{
            value: search,
            onChange: handleSearchChange,
          }}
          onView={(row) => router.push(`/dashboard/sales/${row.id}`)}
          renderExtraActions={(row) =>
            <>
              {canOpenPaymentFlow &&
                row.estado !== "Anulada" &&
                !isGatewayPaymentMethod(row.paymentMethod) ? (
                <button
                  onClick={() => setPaymentSaleId(row.id)}
                  className="p-1 rounded-full cursor-pointer text-black transition-all duration-300 hover:scale-110 hover:bg-[#06a646]/30"
                  title={isClientUser ? "Ver solicitud de pago" : "Gestionar pagos"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9h20"></path>
                    <path d="M6 15h2"></path>
                    <path d="M10 15h5"></path>
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  </svg>
                </button>
              ) : null}
              {hasSalesCancel && row.estado === "Pendiente" ? (
                <button
                  onClick={() => handleOpenAnnul(row)}
                  className="p-1 rounded-full cursor-pointer text-black transition-all duration-300 hover:scale-110 hover:bg-[#06a646]/30"
                  title="Anular Venta"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </button>
              ) : null}
            </>
          }
          rightActions={
            <div className="flex items-center gap-2">
              {hasSalesExport ? (
                <button
                  onClick={exportToExcel}
                  className="cursor-pointer inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: Colors.buttons.primary }}
                  title="Exportar a Excel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Reporte
                </button>
              ) : null}
            </div>
          }
          onCreate={hasSalesCreate ? () => setCreateModalOpen(true) : undefined}
          createButtonText="Nueva Venta"
          module={"Sales"}
          loading={loading}
        />
      )}

      <SalePaymentsModal
        saleId={paymentSaleId}
        onClose={closePaymentModal}
        onSaved={async () => {
          await loadSalesPage(currentPage, search);
        }}
      />

      <Modal
        title="Anular Venta"
        isOpen={isAnnulModalOpen}
        onClose={() => setAnnulModalOpen(false)}
      >
        <div className="bg-white p-4 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500">Codigo Venta</div>
              <div className="font-medium text-gray-800">{saleToAnnul?.codigo || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Cliente</div>
              <div className="font-medium text-gray-800">{saleToAnnul?.cliente || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Fecha Venta</div>
              <div className="font-medium text-gray-800">{saleToAnnul?.fecha || new Date().toLocaleDateString("es-CO")}</div>
            </div>
          </div>

          <hr className="mb-4" />

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Motivo de anulacion
            </label>
            <textarea
              rows={5}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
              placeholder="Especifique la razon..."
              value={annulReason}
              onChange={(e) => setAnnulReason(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-4">
            <div>
              <div className="text-xs text-gray-500">Usuario que anula</div>
              <div className="font-medium text-gray-800">Automatico</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Fecha Anulacion</div>
              <div className="font-medium text-gray-800">{new Date().toLocaleDateString("es-CO")}</div>
            </div>
          </div>

          <hr />

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={() => setAnnulModalOpen(false)}
              disabled={annulling}
              className="px-4 py-2 rounded-md font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmAnnul}
              disabled={annulling}
              className="cursor-pointer rounded-md bg-[#2a9781] px-4 py-2 font-medium text-white transition duration-300 hover:scale-105 hover:bg-[#227a69] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
            >
              {annulling && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Anular Venta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
