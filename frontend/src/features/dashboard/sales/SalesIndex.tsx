"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";
import Modal from "@/features/dashboard/components/Modal";
import { useLoader } from "@/shared/components/loader";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Colors from "@/shared/theme/colors";
import { ISale } from "./types/sales.type";
import { getSales, annulSale, updateEstadoPago } from "./services/sales.service";
import CreateSaleForm from "./components/CreateSaleForm";
import SaleDetailModal from "./components/SaleDetailModal";

// ── Tipo de fila de tabla ────────────────────────────────────────────────────
type SaleRow = {
  id: number;
  codigo: string;
  cliente: string;
  fecha: string;     // Formato visual: DD/MM/YYYY
  fechaISO: string;  // Formato ISO para ordenamiento: YYYY-MM-DD o timestamp
  total: number;
  estado: string;
  estadoPago: "Abonada" | "Pagada" | null;
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function SalesIndex() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [viewSaleId, setViewSaleId] = useState<number | null>(null);
  const { showLoader, hideLoader } = useLoader();

  // ── Estado de Anulación ──
  const [isAnnulModalOpen, setAnnulModalOpen] = useState(false);
  const [saleToAnnul, setSaleToAnnul] = useState<SaleRow | null>(null);
  const [annulReason, setAnnulReason] = useState("");
  const [annulling, setAnnulling] = useState(false);

  // ── Cargar ventas desde la API ────────────────────────────────────────────
  const loadSales = useCallback(async () => {
    try {
      const data: ISale[] = await getSales();
      const mapped: SaleRow[] = data.map((s) => ({
        id: s.saleid,
        codigo: s.salecode,
        cliente: s.customer?.users
          ? `${s.customer.users.name} ${s.customer.users.lastname}`
          : `Cliente #${s.customerid}`,
        fechaISO: s.saledate,  // ISO original para ordenamiento
        fecha: new Date(s.saledate).toLocaleDateString("es-CO"),
        total: s.totalamount,
        estado:
          s.salestatus === "Completed"
            ? "Finalizada"
            : s.salestatus === "Cancelled"
              ? "Anulada"
              : s.salestatus === "Pending"
                ? "Pendiente"
                : s.salestatus,
        estadoPago: (s.estadoPago as "Abonada" | "Pagada" | null) ?? null,
      }));
      setSales(mapped);
    } catch (err) {
      console.error(err);
      showError("Error al cargar las ventas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // ── Cambiar estado de pago (interactivo) ─────────────────────────────────
  const handleEstadoPagoChange = async (
    row: SaleRow,
    nuevoEstado: "Abonada" | "Pagada"
  ) => {
    showLoader();
    try {
      await updateEstadoPago(row.id, nuevoEstado);
      showSuccess(
        nuevoEstado === "Pagada"
          ? "Venta marcada como Pagada — ahora está Finalizada."
          : "Venta marcada como Abonada."
      );
      await loadSales();
    } catch {
      showError("Error al actualizar el estado de pago.");
    } finally {
      hideLoader();
    }
  };

  // ── Ordenamiento ──────────────────────────────────────────────────────────
  type SortField = "fecha" | "total";
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedSales = useMemo(() => {
    if (!sortField) return sales;
    return [...sales].sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortField === "fecha") {
        // Usar fechaISO (string ISO o timestamp) para comparar correctamente
        aVal = new Date(a.fechaISO).getTime();
        bVal = new Date(b.fechaISO).getTime();
      } else {
        aVal = a.total;
        bVal = b.total;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [sales, sortField, sortDir]);

  // ── Exportar a Excel ──────────────────────────────────────────────────────
  const exportToExcel = () => {
    const rows = sales.map((s) => ({
      "#": s.id,
      "Código": s.codigo,
      "Cliente": s.cliente,
      "Fecha": s.fecha,
      "Total": s.total,
      "Estado": s.estado,
      "Estado Pago": s.estadoPago ?? "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };


  // ── Abrir modal de anulación (con validación de estadoPago) ────────────────
  const handleOpenAnnul = (row: SaleRow) => {
    // Bloquear si tiene pago o abono registrado
    if (row.estadoPago === "Pagada") {
      showError("No se puede anular una venta que ya fue pagada.");
      return;
    }
    if (row.estadoPago === "Abonada") {
      showError("No se puede anular una venta con abono registrado. Revise el pago antes de anular.");
      return;
    }
    setSaleToAnnul(row);
    setAnnulReason("");
    setAnnulModalOpen(true);
  };

  // ── Confirmar anulación ───────────────────────────────────────────────────
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
    } catch {
      showError("Error al anular la venta.");
    } finally {
      setAnnulling(false);
    }
  };

  // ── Columnas de la tabla ─────────────────────────────────────────────────
  const columns: Column<SaleRow>[] = [
    {
      key: "id",
      header: "#",
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
        // Si la venta está anulada o finalizada, mostrar solo el valor sin botones
        if (row.estado === "Anulada" || row.estado === "Finalizada") {
          return (
            <span className="text-xs text-gray-400 italic">
              {row.estadoPago ?? "—"}
            </span>
          );
        }

        const opciones: Array<"Abonada" | "Pagada"> = ["Abonada", "Pagada"];

        return (
          <div className="flex gap-1">
            {opciones.map((op) => {
              const isActive = row.estadoPago === op;
              return (
                <button
                  key={op}
                  onClick={() => handleEstadoPagoChange(row, op)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isActive
                    ? op === "Pagada"
                      ? "bg-green-100 text-green-700 border-green-300 font-semibold"
                      : "bg-blue-100 text-blue-700 border-blue-300 font-semibold"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  title={isActive ? `Ya marcada como ${op}` : `Marcar como ${op}`}
                >
                  {op}
                </button>
              );
            })}
          </div>
        );
      },
    },
  ];

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-500">Cargando ventas...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ToastContainer position="bottom-right" />

      {/* Crear venta — formulario de página completa */}
      {isCreateModalOpen ? (
        <div className="w-full">
          <CreateSaleForm
            onClose={() => setCreateModalOpen(false)}
            onSaved={() => {
              loadSales();
            }}
          />
        </div>
      ) : (
        <DataTable<SaleRow>
          data={sortedSales}
          columns={columns}
          searchableKeys={["codigo", "cliente", "estado", "estadoPago"]}
          pageSize={10}
          onView={(row) => setViewSaleId(row.id)}
          renderExtraActions={(row) =>
            row.estado === "Pendiente" ? (
              <button
                onClick={() => handleOpenAnnul(row)}
                className="p-1 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-red-300/60 text-red-500"
                title="Anular Venta"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            ) : null
          }
          rightActions={
            <div className="flex items-center gap-2">
              {/* Botones de orden */}
              {(["fecha", "total"] as const).map((field) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${sortField === field
                    ? "bg-red-600 text-white border-red-600"
                    : "text-gray-600 bg-white hover:bg-gray-50 border-gray-300"
                    }`}
                  title={`Ordenar por ${field === "fecha" ? "Fecha" : "Total"}`}
                >
                  {field === "fecha" ? "Fecha" : "Total"}
                  <span className="text-xs">
                    {sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}
                  </span>
                </button>
              ))}
              {/* Excel */}
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 rounded-lg transition-colors"
                title="Exportar a Excel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Excel
              </button>
            </div>
          }
          onCreate={() => setCreateModalOpen(true)}
          createButtonText="Nueva Venta"
          module={"Sales"}
        />
      )}

      {/* Modal Detalle */}
      <SaleDetailModal saleId={viewSaleId} onClose={() => setViewSaleId(null)} />

      {/* Modal Anular Venta */}
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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
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
              className="px-4 py-2 rounded-md font-medium text-white bg-black hover:opacity-90 flex items-center gap-2"
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