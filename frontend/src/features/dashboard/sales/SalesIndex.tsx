"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";
import Modal from "@/features/dashboard/components/Modal";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Colors from "@/shared/theme/colors";
import { ISale } from "./types/sales.type";
import { getSales, annulSale } from "./services/sales.service";
import CreateSaleForm from "./components/CreateSaleForm";
import SalePaymentsModal from "./components/SalePaymentsModal";
import { useAuth } from "@/features/auth/authcontext";

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function normalizeRoleName(role: any) {
  return String(role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toPositiveId(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractAuthClientId(user: any, profile: any): number | null {
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

function decodeJwtPayload(token: string): any | null {
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
  const router = useRouter();
  const { user, profile } = useAuth();
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [tokenPermissions, setTokenPermissions] = useState<string[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [paymentSaleId, setPaymentSaleId] = useState<number | null>(null);

  const [isAnnulModalOpen, setAnnulModalOpen] = useState(false);
  const [saleToAnnul, setSaleToAnnul] = useState<SaleRow | null>(null);
  const [annulReason, setAnnulReason] = useState("");
  const [annulling, setAnnulling] = useState(false);

  const authRole = normalizeRoleName(
    (user as any)?.rolename ??
    (profile as any)?.rolename ??
    (profile as any)?.role?.name ??
    (profile as any)?.users?.rolename
  );
  const authClientId = extractAuthClientId(user, profile);
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

  const loadSales = useCallback(async () => {
    try {
      const data = await getSales();
      const visibleSales =
        isClientUser && authClientId
          ? data.filter((sale) => Number(sale.customerid) === authClientId)
          : data;

      const mapped: SaleRow[] = visibleSales.map((sale) => ({
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

      setSales(mapped);
    } catch (error) {
      console.error(error);
      showError("Error al cargar las ventas.");
    } finally {
      setLoading(false);
    }
  }, [authClientId, isClientUser]);

  const closePaymentModal = useCallback(() => {
    setPaymentSaleId(null);
  }, []);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!hasSalesRead) {
      setLoading(false);
      return;
    }
    loadSales();
  }, [hasSalesRead, loadSales, permissionsLoaded]);

  const exportToExcel = () => {
    const rows = sales.map((sale) => ({
      "ID": sale.id,
      "Código": sale.codigo,
      Cliente: sale.cliente,
      Fecha: sale.fecha,
      Total: sale.total,
      Estado: sale.estado,
      "Estado Pago": sale.estadoPago,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
      showError("Debe ingresar un motivo para la anulación.");
      return;
    }

    setAnnulling(true);
    try {
      await annulSale(saleToAnnul.id, annulReason, "Admin");
      showSuccess(`Venta ${saleToAnnul.codigo} anulada correctamente.`);
      setAnnulModalOpen(false);
      loadSales();
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
    { key: "codigo", header: "Código Venta" },
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

  if (!permissionsLoaded || (loading && hasSalesRead)) {
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
            onSaved={() => {
              loadSales();
            }}
          />
        </div>
      ) : (
        <DataTable<SaleRow>
          data={sales}
          columns={columns}
          searchableKeys={["codigo", "cliente", "estado", "estadoPago"]}
          pageSize={10}
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
        />
      )}

      <SalePaymentsModal
        saleId={paymentSaleId}
        onClose={closePaymentModal}
        onSaved={loadSales}
      />

      <Modal
        title="Anular Venta"
        isOpen={isAnnulModalOpen}
        onClose={() => setAnnulModalOpen(false)}
      >
        <div className="bg-white p-4 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500">Código Venta</div>
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
              Motivo de anulación
            </label>
            <textarea
              rows={5}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
              placeholder="Especifique la razón..."
              value={annulReason}
              onChange={(e) => setAnnulReason(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-4">
            <div>
              <div className="text-xs text-gray-500">Usuario que anula</div>
              <div className="font-medium text-gray-800">Automático</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Fecha Anulación</div>
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
