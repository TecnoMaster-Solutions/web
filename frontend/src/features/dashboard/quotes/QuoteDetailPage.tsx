"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import RequireAuth from "../../auth/requireauth";
import ViewQuote from "./components/ViewQuote";
import {
  completeQuote,
  getQuoteById,
} from "./api/quotes.api";
import { updateOrderService } from "@/features/dashboard/OrdersServices/api/ordersServices.api";
import { updateServiceRequest } from "@/features/dashboard/requests/services/servicerequests.service";

type Props = {
  quoteId: number;
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

export default function QuoteDetailPage({ quoteId }: Props) {
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCompletingQuote, setCompletingQuote] = useState(false);
  const [isFinalizingQuote, setFinalizingQuote] = useState(false);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getQuoteById(quoteId);
      setQuote(data);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleCompleteQuote = useCallback(async () => {
    if (!quote) return;

    const id = Number(quote.quotesid ?? quote.id ?? quoteId);
    if (!id) {
      await Swal.fire("Error", "ID de cotizaciÃ³n invÃ¡lido.", "error");
      return;
    }

    const confirm = await Swal.fire({
      title: "Â¿Completar cotizaciÃ³n?",
      text: "Se generarÃ¡ la venta correspondiente y la cotizaciÃ³n pasarÃ¡ a estado completado.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Completar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setCompletingQuote(true);
      await completeQuote(id);
      await fetchQuote();
      await Swal.fire(
        "CotizaciÃ³n completada",
        "Se creÃ³ la venta asociada y la cotizaciÃ³n se actualizÃ³.",
        "success",
      );
    } catch (error: any) {
      await Swal.fire(
        "Error",
        error?.response?.data?.message ?? error?.message ?? "No se pudo completar la cotizaciÃ³n.",
        "error",
      );
    } finally {
      setCompletingQuote(false);
    }
  }, [fetchQuote, quote, quoteId]);

  const handleFinalizeQuote = useCallback(async () => {
    if (!quote) return;

    const serviceRequestId = getQuoteServiceRequestId(quote);
    const orderServiceId = getQuoteOrderServiceId(quote);

    if (!serviceRequestId && !orderServiceId) {
      await Swal.fire("Sin registros relacionados", "La cotizaciÃ³n no tiene orden ni solicitud asociada.", "warning");
      return;
    }

    const targets = [
      serviceRequestId ? "solicitud de servicio" : null,
      orderServiceId ? "orden de servicio" : null,
    ].filter(Boolean) as string[];
    const targetText = targets.join(" y ");
    const verb = targets.length > 1 ? "marcarÃ¡n" : "marcarÃ¡";
    const suffix = targets.length > 1 ? "finalizados" : "finalizado";

    const confirm = await Swal.fire({
      title: "Â¿Finalizar cotizaciÃ³n?",
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
      await fetchQuote();
      await Swal.fire("Finalizado", `Se ${verb} ${targetText} como ${suffix} (estado 6).`, "success");
    } catch (error: any) {
      await Swal.fire(
        "Error",
        error?.response?.data?.message ?? error?.message ?? "No se pudieron actualizar los registros.",
        "error",
      );
    } finally {
      setFinalizingQuote(false);
    }
  }, [fetchQuote, quote]);

  const quoteStateName = quote?.state?.name ?? "";
  const isQuoteCompleted = quoteStateName
    ? quoteStateName.toLowerCase().includes("complet") ||
      quoteStateName.toLowerCase().includes("finish") ||
      quoteStateName.toLowerCase().includes("finaliz")
    : false;
  const canFinalize = Boolean(getQuoteServiceRequestId(quote) || getQuoteOrderServiceId(quote));

  return (
    <RequireAuth>
      <div className="p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold">Detalle de CotizaciÃ³n #{quoteId}</h1>
          <button
            type="button"
            onClick={() => router.push("/dashboard/quotes")}
            className="cursor-pointer px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Volver
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Cargando cotizaciÃ³n...</div>
        ) : quote ? (
          <ViewQuote
            quote={quote}
            canComplete={!isQuoteCompleted}
            isCompleting={isCompletingQuote}
            onComplete={handleCompleteQuote}
            canFinalize={canFinalize}
            isFinalizing={isFinalizingQuote}
            onFinalize={handleFinalizeQuote}
          />
        ) : (
          <div className="text-sm text-green-600">No se pudo cargar la cotizaciÃ³n.</div>
        )}
      </div>
    </RequireAuth>
  );
}

