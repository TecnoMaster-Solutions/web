"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import RequireAuth from "../../auth/requireauth";
import ViewQuote from "./components/ViewQuote";
import { completeQuote, getQuoteById } from "./api/quotes.api";
import { updateOrderService } from "@/features/dashboard/OrdersServices/api/ordersServices.api";
import { updateServiceRequest } from "@/features/dashboard/requests/services/servicerequests.service";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { showError, showSuccess, showWarning } from "@/shared/utils/notifications";
import { IQuote } from "./types/Quote.type";

type Props = {
  quoteId: number;
};

type QuoteWithRelations = IQuote & {
  id?: number;
  servicerequestid?: number | null;
  servicerequestId?: number | null;
  ordersservicesid?: number | null;
  ordersservicesId?: number | null;
  order?: {
    ordersservicesid?: number | null;
    ordersservicesId?: number | null;
    id?: number | null;
  };
  ordersservices?: {
    ordersservicesid?: number | null;
    id?: number | null;
  } | null;
};

type ApiErrorShape = {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as ApiErrorShape;
  return apiError.response?.data?.message || apiError.message || fallback;
};

const toPositiveInteger = (value: unknown): number | null => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const integer = Math.trunc(numeric);
  return integer > 0 ? integer : null;
};

const getQuoteServiceRequestId = (
  quote?: QuoteWithRelations | null,
): number | null => {
  if (!quote) return null;
  const candidates = [
    quote.serviceRequest?.serviceRequestId,
    (quote.serviceRequest as { id?: number } | undefined)?.id,
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

const getQuoteOrderServiceId = (
  quote?: QuoteWithRelations | null,
): number | null => {
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
  const { canView, canUpdate, has } = usePermissions();
  const canViewQuotes = canView("quotes");
  const canUpdateQuotes = canUpdate("quotes");
  const canCompleteQuotes = has("quotes", "complete");

  const [quote, setQuote] = useState<QuoteWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompletingQuote, setCompletingQuote] = useState(false);
  const [isFinalizingQuote, setFinalizingQuote] = useState(false);

  const fetchQuote = useCallback(async () => {
    if (!canViewQuotes) {
      setQuote(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getQuoteById(quoteId);
      setQuote(data as QuoteWithRelations);
    } finally {
      setLoading(false);
    }
  }, [canViewQuotes, quoteId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleCompleteQuote = useCallback(async () => {
    if (!quote) return;
    if (!canCompleteQuotes) {
      showWarning("No tienes permisos para completar cotizaciones.");
      return;
    }

    const id = Number(quote.quotesid ?? quote.id ?? quoteId);
    if (!id) {
      showError("ID de cotizacion invalido.");
      return;
    }

    const confirm = await Swal.fire({
      title: "Completar cotizacion?",
      text: "Se generara la venta correspondiente y la cotizacion pasara a estado completado.",
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
      showSuccess("Se creo la venta asociada y la cotizacion se actualizo.");
    } catch (error: unknown) {
      showError(getErrorMessage(error, "No se pudo completar la cotizacion."));
    } finally {
      setCompletingQuote(false);
    }
  }, [canCompleteQuotes, fetchQuote, quote, quoteId]);

  const handleFinalizeQuote = useCallback(async () => {
    if (!quote) return;
    if (!canUpdateQuotes) {
      showWarning("No tienes permisos para finalizar cotizaciones.");
      return;
    }

    const serviceRequestId = getQuoteServiceRequestId(quote);
    const orderServiceId = getQuoteOrderServiceId(quote);

    if (!serviceRequestId && !orderServiceId) {
      showWarning("La cotizacion no tiene orden ni solicitud asociada.");
      return;
    }

    const targets = [
      serviceRequestId ? "solicitud de servicio" : null,
      orderServiceId ? "orden de servicio" : null,
    ].filter(Boolean) as string[];
    const targetText = targets.join(" y ");
    const verb = targets.length > 1 ? "marcaran" : "marcara";
    const suffix = targets.length > 1 ? "finalizados" : "finalizado";

    const confirm = await Swal.fire({
      title: "Finalizar cotizacion?",
      text: `Se ${verb} ${targetText} como ${suffix} (estado 6).`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Finalizar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      setFinalizingQuote(true);
      const requests: Promise<unknown>[] = [];
      if (serviceRequestId) {
        requests.push(updateServiceRequest(serviceRequestId, { stateId: 6 }));
      }
      if (orderServiceId) {
        requests.push(updateOrderService(orderServiceId, { stateid: 6 }));
      }
      if (requests.length) await Promise.all(requests);
      await fetchQuote();
      showSuccess(`Se ${verb} ${targetText} como ${suffix} (estado 6).`);
    } catch (error: unknown) {
      showError(
        getErrorMessage(error, "No se pudieron actualizar los registros."),
      );
    } finally {
      setFinalizingQuote(false);
    }
  }, [canUpdateQuotes, fetchQuote, quote]);

  const quoteStateName = quote?.state?.name ?? "";
  const isQuoteCompleted = quoteStateName
    ? quoteStateName.toLowerCase().includes("complet") ||
      quoteStateName.toLowerCase().includes("finish") ||
      quoteStateName.toLowerCase().includes("finaliz")
    : false;

  const canFinalize = Boolean(
    getQuoteServiceRequestId(quote) || getQuoteOrderServiceId(quote),
  );
  const canComplete = canCompleteQuotes && !isQuoteCompleted;
  const canFinalizeQuote = canUpdateQuotes && canFinalize;

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Cotizaciones
            </p>
            <h1 className="text-xl font-semibold text-slate-900">
              Detalle #{quoteId}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/quotes")}
            className="cursor-pointer rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            Volver
          </button>
        </div>

        {!canViewQuotes ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-20">
            <span className="text-gray-500">
              No tienes permisos para visualizar cotizaciones.
            </span>
          </div>
        ) : loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-sm text-gray-500">
            Cargando cotizacion...
          </div>
        ) : quote ? (
          <ViewQuote
            quote={quote}
            canComplete={canComplete}
            isCompleting={isCompletingQuote}
            onComplete={handleCompleteQuote}
            canFinalize={canFinalizeQuote}
            isFinalizing={isFinalizingQuote}
            onFinalize={handleFinalizeQuote}
          />
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-sm text-red-600">
            No se pudo cargar la cotizacion.
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
