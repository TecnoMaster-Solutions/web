"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  clearMercadoPagoCheckoutLocalState,
  getLastMercadoPagoSaleId,
  getSaleStatus,
  verifyMercadoPagoPayment,
} from "../services/mercadoPagoCheckout.service";
import type { SalePaymentStatusResponse } from "../types";
import PaymentResultCard from "./PaymentResultCard";
import { routes } from "@/shared/routes";
import { Loader } from "@/shared/components/loader";

const normalizeMpParam = (value: string | null) =>
  !value || value === "null" ? null : value;

type VerifyState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; saleId: number | null }
  | { kind: "error"; message: string };

type SaleState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; sale: SalePaymentStatusResponse }
  | { kind: "error"; message: string };

function mapMercadoPagoStatusToSaleStatus(
  status?: string | null
): SalePaymentStatusResponse["status"] {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "approved") return "PAID";
  if (normalized === "rejected" || normalized === "cancelled") return "REJECTED";
  return "PENDING";
}

export default function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const [verifyState, setVerifyState] = useState<VerifyState>({ kind: "idle" });
  const [saleState, setSaleState] = useState<SaleState>({ kind: "idle" });

  const paymentId =
    normalizeMpParam(searchParams.get("payment_id")) ??
    normalizeMpParam(searchParams.get("collection_id"));
  const externalReference = normalizeMpParam(
    searchParams.get("external_reference")
  );

  useEffect(() => {
    if (!paymentId) {
      setVerifyState({ kind: "done", saleId: getLastMercadoPagoSaleId() });
      return;
    }

    let cancelled = false;
    setVerifyState({ kind: "loading" });

    (async () => {
      try {
        const res = await verifyMercadoPagoPayment(paymentId);
        if (cancelled) return;
        const saleId =
          typeof res.saleId === "number" && Number.isFinite(res.saleId)
            ? res.saleId
            : getLastMercadoPagoSaleId();
        setVerifyState({ kind: "done", saleId: saleId ?? null });
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo verificar el pago con el backend.";
        setVerifyState({ kind: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  useEffect(() => {
    if (verifyState.kind !== "done") return;
    const saleId = verifyState.saleId ?? getLastMercadoPagoSaleId();
    if (!saleId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8; // ~16s

    const poll = async () => {
      attempts += 1;
      setSaleState((prev) => (prev.kind === "done" ? prev : { kind: "loading" }));

      try {
        const sale = await getSaleStatus(saleId);
        if (cancelled) return;
        setSaleState({ kind: "done", sale });

        if (sale.status !== "PAID" && attempts < maxAttempts) {
          setTimeout(() => {
            if (!cancelled) void poll();
          }, 2000);
        }
      } catch (error) {
        if (cancelled) return;
        if (
          error instanceof Error &&
          error.message === "NO_REFRESH_TOKEN" &&
          paymentId
        ) {
          try {
            const verify = await verifyMercadoPagoPayment(paymentId);
            if (cancelled) return;

            const inferredStatus = mapMercadoPagoStatusToSaleStatus(
              typeof verify.status === "string" ? verify.status : null
            );

            setSaleState({
              kind: "done",
              sale: {
                saleId,
                status: inferredStatus,
                totalAmount: 0,
                currency: "COP",
                mpPreferenceId: null,
                mpPaymentId: paymentId,
                externalReference:
                  (typeof verify.externalReference === "string"
                    ? verify.externalReference
                    : null) ?? externalReference,
                rawSaleStatus:
                  typeof verify.status === "string" ? verify.status : null,
                mpPaymentStatus:
                  typeof verify.status === "string" ? verify.status : null,
              },
            });

            if (inferredStatus !== "PAID" && attempts < maxAttempts) {
              setTimeout(() => {
                if (!cancelled) void poll();
              }, 2000);
            }
            return;
          } catch {
            // continua al manejo de error normal
          }
        }
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo consultar el estado de la venta.";
        setSaleState({ kind: "error", message });
      }
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [verifyState, paymentId, externalReference]);

  const ui = useMemo(() => {
    if (saleState.kind === "done") {
      if (saleState.sale.status === "PAID") {
        return {
          title: "Pago aprobado",
          description: "La venta fue confirmada por el backend y marcada como pagada.",
          tone: "success" as const,
        };
      }

      return {
        title: "Confirmando pago...",
        description:
          "Recibimos tu retorno desde Mercado Pago, pero el backend aún no marca la venta como pagada. Seguimos consultando unos segundos.",
        tone: "pending" as const,
      };
    }

    if (saleState.kind === "error") {
      return {
        title: "Confirmando pago...",
        description: `No se pudo consultar el estado de la venta: ${saleState.message}`,
        tone: "pending" as const,
      };
    }

    return {
      title: "Confirmando pago...",
      description:
        "Estamos verificando el pago con Mercado Pago y sincronizando el estado real de la venta en el backend.",
      tone: "pending" as const,
    };
  }, [saleState]);

  const isPaid = saleState.kind === "done" && saleState.sale.status === "PAID";
  const paidExternalReference =
    (saleState.kind === "done" ? saleState.sale.externalReference : null) ??
    externalReference;
  const paidPaymentId =
    (saleState.kind === "done" ? saleState.sale.mpPaymentId : null) ?? paymentId;

  const handleReturnToCart = () => {
    if (typeof window === "undefined") return;

    const targetCartUrl = routes.landing.cart;

    try {
      const opener = window.opener as Window | null;
      if (opener && !opener.closed) {
        try {
          opener.location.href = targetCartUrl;
        } catch {
          // Si no permite cambiar la ubicación, al menos intentar enfocar.
        }

        try {
          opener.focus();
        } catch {
          // ignore
        }

        window.close();
        return;
      }
    } catch {
      // ignore and fallback
    }

    window.location.href = targetCartUrl;
  };

  useEffect(() => {
    if (!isPaid) return;
    clearMercadoPagoCheckoutLocalState();
  }, [isPaid]);

  if (isPaid) {
    return (
      <main className="min-h-[70vh] bg-gradient-to-b from-emerald-50 via-white to-white px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <h1 className="text-center text-3xl font-bold text-emerald-900">
            Pago realizado con éxito
          </h1>

          <p className="mt-3 text-center text-base text-slate-700">
            La venta{" "}
            <span className="font-semibold text-slate-900">
              {paidExternalReference ?? "No disponible"}
            </span>{" "}
            con pago{" "}
            <span className="font-semibold text-slate-900">
              {paidPaymentId ?? "No disponible"}
            </span>{" "}
            ha sido pagada con éxito.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleReturnToCart}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Volver al carrito de compra
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (saleState.kind !== "error") {
    return (
      <main className="min-h-[70vh] bg-gradient-to-b from-amber-50 via-white to-white px-4 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <Loader size="md" className="text-amber-500" />
            <h1 className="mt-5 text-2xl font-bold text-amber-900">
              Confirmando pago...
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Estamos verificando el pago con Mercado Pago y sincronizando la
              venta con el backend.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PaymentResultCard
      title={ui.title}
      description={ui.description}
      tone={ui.tone}
      details={[]}
      extra={
        verifyState.kind === "error" ? (
          <p className="text-sm text-amber-700">
            La verificación fallback falló: {verifyState.message}
          </p>
        ) : null
      }
    />
  );
}
