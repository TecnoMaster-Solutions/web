"use client";

import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import RequireAuth from "../../auth/requireauth";
import { DataTable } from "../components/datatable/DataTable";
import Modal from "../components/Modal";
import { ToastContainer } from "react-toastify";
import { Column } from "../components/datatable/types/column.types";
import Image from "next/image";
import { useRouter } from "next/navigation";

import ViewQuote from "./components/ViewQuote";

import { updateOrderService } from "@/features/dashboard/OrdersServices/api/ordersServices.api";
import { updateServiceRequest } from "@/features/dashboard/requests/services/servicerequests.service";

import {
  getQuotes,
  approveQuote,
  completeQuote,
  cancelQuote,
  revokeQuote,
} from "./api/quotes.api";

import { QuoteTableRow } from "./types/Quote.type";
import Colors from "@/shared/theme/colors";

/* ================================
 * NORMALIZACIÓN DE ESTADOS (VISUAL)
 * ================================ */
type QuoteStatusConfig = {
  label: string;
  className: string;
  style?: React.CSSProperties;
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

/* ================================
 * ESTADO EN ESPAÑOL (BÚSQUEDA)
 * ================================ */
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

const toPositiveInteger = (value: any): number | null => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const integer = Math.trunc(numeric);
  return integer > 0 ? integer : null;
};

const getQuoteServiceRequestId = (quote?: any): number | null => {
  if (!quote) return null;
  const candidates = [
    quote.serviceRequest?.serviceRequestId,
    quote.serviceRequest?.id,
    quote.serviceRequestId,
    quote.servicerequestid,
    quote.servicerequestId,
  ];
  for (const candidate of candidates) {
    const id = toPositiveInteger(candidate);
    if (id) return id;
  }
  return null;
};

const getQuoteOrderServiceId = (quote?: any): number | null => {
  if (!quote) return null;
  const candidates = [
    quote.ordersservices?.ordersservicesid,
    quote.ordersservices?.id,
    quote.ordersservicesid,
    quote.ordersservicesId,
    quote.order?.ordersservicesid,
    quote.order?.ordersservicesId,
    quote.order?.id,
  ];
  for (const candidate of candidates) {
    const id = toPositiveInteger(candidate);
    if (id) return id;
  }
  return null;
};

export default function QuotesIndex() {
  const router = useRouter();

  const [quotesData, setQuotesData] = useState<QuoteTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  const [isCompletingQuote, setCompletingQuote] = useState(false);
  const [isFinalizingQuote, setFinalizingQuote] = useState(false);

  /* ================================
   * CARGAR COTIZACIONES
   * ================================ */
  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getQuotes();

      const mapped: QuoteTableRow[] = (data ?? []).map((q: any) => {
        const rawStatus = q.state?.name ?? "";
        const clientName = `${q.customer?.users?.name ?? ""} ${q.customer?.users?.lastname ?? ""}`.trim();
        const techName = `${q.technician?.users?.name ?? ""} ${q.technician?.users?.lastname ?? ""}`.trim();

        return {
          id: q.quotesid,
          client: clientName,
          technician: techName,
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
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  /* ================================
   * COLUMNAS
   * ================================ */
  const columns: Column<QuoteTableRow>[] = [
    { key: "id", header: "ID" },
    { key: "client", header: "Cliente" },
    { key: "technician", header: "Técnico" },
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

  /* ================================
   * APROBAR
   * ================================ */
  const handleApproveQuote = async (row: QuoteTableRow) => {
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

    try {
      await approveQuote(row.id);
    } catch (error: any) {
      console.error("Error al aprobar la cotización:", error);
      await Swal.fire(
        "Error",
        error?.response?.data?.message ?? error?.message ?? "No se pudo aprobar la cotización.",
        "error"
      );
      return;
    }

    let completionResult: any = null;
    try {
      completionResult = await completeQuote(row.id);
    } catch (error: any) {
      console.error("Error al convertir la cotización:", error);
      await fetchQuotes();
      await Swal.fire(
        "Cotización aprobada",
        "La cotización quedó en estado aprobada, pero no se pudo generar la venta.",
        "warning"
      );
      return;
    }

    await fetchQuotes();

    await Swal.fire(
      "Cotización completada",
      completionResult?.sale
        ? `Venta generada: ${completionResult.sale.salecode ?? completionResult.sale.saleid}`
        : "La cotización se completó y se creó la venta asociada.",
      "success"
    );
  };

  /* ================================
   * CANCELAR (CLIENTE)
   * ================================ */
  const handleCancelQuote = async (row: QuoteTableRow) => {
    const r = await Swal.fire({
      title: "¿Cancelar cotización?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
      confirmButtonColor: "#b91c1c",
    });

    if (!r.isConfirmed) return;

    try {
      await cancelQuote(row.id);
      await fetchQuotes();
      await Swal.fire("Cancelada", "Cotización cancelada", "success");
    } catch (error: any) {
      console.error(error);
      await Swal.fire(
        "Error",
        error?.response?.data?.message ?? error?.message ?? "No se pudo cancelar la cotización.",
        "error"
      );
    }
  };

  /* ================================
   * ANULAR (ADMIN)
   * ================================ */
  const handleRevokeQuote = async (row: QuoteTableRow) => {
    const status = row.statusSearch;

    if (status !== "aprobada") {
      await Swal.fire({
        icon: "warning",
        title: "Acción no permitida",
        text: "Solo se pueden anular cotizaciones que estén aprobadas.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#b20000",
      });
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
      await Swal.fire({
        icon: "success",
        title: "Cotización anulada",
        text: "La cotización fue anulada correctamente.",
      });
    } catch (error: any) {
      console.error(error);
      await Swal.fire(
        "Error",
        error?.response?.data?.message ?? error?.message ?? "No se pudo anular la cotización.",
        "error"
      );
    }
  };

  /* ================================
   * COMPLETAR (desde modal detalle)
   * ================================ */
  const handleCompleteQuote = useCallback(async () => {
    if (!selectedQuote) return;

    const quoteId = Number(selectedQuote.quotesid ?? selectedQuote.id ?? selectedQuote.quoteId ?? 0);

    if (!quoteId) {
      await Swal.fire("Error", "ID de cotización inválido.", "error");
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Completar cotización?",
      text: "Se generará la venta correspondiente y la cotización pasará a estado completado.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Completar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setCompletingQuote(true);
      await completeQuote(quoteId);
      await fetchQuotes();

      setDetailModalOpen(false);
      setSelectedQuote(null);

      await Swal.fire(
        "Cotización completada",
        "Se creó la venta asociada y la cotización se actualizó.",
        "success"
      );
    } catch (error: any) {
      console.error(error);
      await Swal.fire(
        "Error",
        error?.response?.data?.message ?? error?.message ?? "No se pudo completar la cotización.",
        "error"
      );
    } finally {
      setCompletingQuote(false);
    }
  }, [selectedQuote, fetchQuotes]);

  /* ================================
   * FINALIZAR (actualiza orden/solicitud a estado 6)
   * ================================ */
  const handleFinalizeQuote = useCallback(async () => {
    if (!selectedQuote) return;

    const serviceRequestId = getQuoteServiceRequestId(selectedQuote);
    const orderServiceId = getQuoteOrderServiceId(selectedQuote);

    if (!serviceRequestId && !orderServiceId) {
      await Swal.fire("Sin registros relacionados", "La cotización no tiene orden ni solicitud asociada.", "warning");
      return;
    }

    const targets = [
      serviceRequestId ? "solicitud de servicio" : null,
      orderServiceId ? "orden de servicio" : null,
    ].filter(Boolean) as string[];

    const targetText = targets.join(" y ");
    const verb = targets.length > 1 ? "marcarán" : "marcará";
    const suffix = targets.length > 1 ? "finalizados" : "finalizado";

    const confirm = await Swal.fire({
      title: "¿Finalizar cotización?",
      text: `Se ${verb} ${targetText} como ${suffix} (estado 6).`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Finalizar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setFinalizingQuote(true);

      const requests: Promise<any>[] = [];

      if (serviceRequestId) requests.push(updateServiceRequest(serviceRequestId, { stateId: 6 }));
      if (orderServiceId) requests.push(updateOrderService(orderServiceId, { stateid: 6 }));

      if (requests.length) await Promise.all(requests);

      await fetchQuotes();

      await Swal.fire("Finalizado", `Se ${verb} ${targetText} como ${suffix} (estado 6).`, "success");
    } catch (error: any) {
      console.error("Error al actualizar estados:", error);
      await Swal.fire(
        "Error",
        error?.response?.data?.message ?? error?.message ?? "No se pudieron actualizar los registros.",
        "error"
      );
    } finally {
      setFinalizingQuote(false);
    }
  }, [selectedQuote, fetchQuotes]);

  /* ================================
   * RENDER
   * ================================ */
  const selectedQuoteStateName = selectedQuote?.state?.name ?? "";
  const isSelectedQuoteCompleted =
    selectedQuoteStateName
      ? selectedQuoteStateName.toLowerCase().includes("complet") ||
        selectedQuoteStateName.toLowerCase().includes("finish") ||
        selectedQuoteStateName.toLowerCase().includes("finaliz")
      : false;

  const selectedServiceRequestId = getQuoteServiceRequestId(selectedQuote);
  const selectedOrderServiceId = getQuoteOrderServiceId(selectedQuote);
  const canFinalizeSelectedQuote = Boolean(selectedServiceRequestId || selectedOrderServiceId);

  return (
    <RequireAuth>
      <div className="p-6">
        <ToastContainer position="bottom-right" />

        <h1 className="text-xl font-semibold mb-4">Listado de Cotizaciones</h1>

        <DataTable<QuoteTableRow>
          module="quotes"
          data={quotesData}
          columns={columns}
          loading={loading}
          searchableKeys={["id", "client", "technician", "statusSearch", "amount", "creationDate"]}
          pageSize={8}
          onView={(row) => {
            setSelectedQuote(row.raw);
            setDetailModalOpen(true);
          }}
          onCreate={() => router.push("/dashboard/quotes/register")}
          createButtonText="Crear Cotización"
          onCheck={handleApproveQuote}
          onCancel={handleCancelQuote}
          onDelete={handleRevokeQuote}
          rightActions={
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#b20000] text-white text-sm font-semibold hover:bg-[#910000]"
              onClick={() => Swal.fire("Pendiente", "Conecta aquí la descarga del reporte.", "info")}
            >
              <Image src="/icons/download.svg" alt="Descargar" width={16} height={16} />
              Descargar Reporte
            </button>
          }
        />

        <Modal
          title="Detalle de Cotización"
          isOpen={isDetailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          footer={null}
        >
          {selectedQuote && (
            <ViewQuote
              quote={selectedQuote}
              canComplete={!isSelectedQuoteCompleted}
              isCompleting={isCompletingQuote}
              onComplete={handleCompleteQuote}
              canFinalize={canFinalizeSelectedQuote}
              isFinalizing={isFinalizingQuote}
              onFinalize={handleFinalizeQuote}
            />
          )}
        </Modal>
      </div>
    </RequireAuth>
  );
}
