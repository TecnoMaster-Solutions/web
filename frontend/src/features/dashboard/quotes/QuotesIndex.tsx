"use client";

import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import RequireAuth from "../../auth/requireauth";
import { DataTable } from "../components/datatable/DataTable";
import { ToastContainer } from "react-toastify";
import { Column } from "../components/datatable/types/column.types";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  getQuotes,
  approveQuote,
  completeQuote,
  cancelQuote,
  revokeQuote,
} from "./api/quotes.api";

import { QuoteTableRow } from "./types/Quote.type";
import Colors from "@/shared/theme/colors";

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

export default function QuotesIndex() {
  const router = useRouter();

  const [quotesData, setQuotesData] = useState<QuoteTableRow[]>([]);
  const [loading, setLoading] = useState(true);

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
      await Swal.fire(
        "Error",
        error?.response?.data?.message ?? error?.message ?? "No se pudo cancelar la cotización.",
        "error"
      );
    }
  };

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
      await Swal.fire(
        "Error",
        error?.response?.data?.message ?? error?.message ?? "No se pudo anular la cotización.",
        "error"
      );
    }
  };

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
          onView={(row) => router.push(`/dashboard/quotes/${row.id}`)}
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
      </div>
    </RequireAuth>
  );
}
