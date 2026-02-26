"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getLastMercadoPagoSaleId,
  getSaleStatus,
  verifyMercadoPagoPayment,
} from "../services/mercadoPagoCheckout.service";
import type { SalePaymentStatusResponse } from "../types";
import PaymentResultCard from "./PaymentResultCard";
import { routes } from "@/shared/routes";

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

export default function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const [verifyState, setVerifyState] = useState<VerifyState>({ kind: "idle" });
  const [saleState, setSaleState] = useState<SaleState>({ kind: "idle" });

  const paymentId =
    normalizeMpParam(searchParams.get("payment_id")) ??
    normalizeMpParam(searchParams.get("collection_id"));
  const paymentStatus =
    normalizeMpParam(searchParams.get("status")) ??
    normalizeMpParam(searchParams.get("collection_status"));
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
  }, [verifyState]);

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

  const resolvedSaleId =
    verifyState.kind === "done" ? verifyState.saleId : getLastMercadoPagoSaleId();

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

  return (
    <PaymentResultCard
      title={ui.title}
      description={ui.description}
      tone={ui.tone}
      details={[
        { label: "saleId", value: resolvedSaleId ? String(resolvedSaleId) : null },
        {
          label: "payment_id / collection_id",
          value: paymentId,
        },
        { label: "status (query)", value: paymentStatus },
        { label: "external_reference", value: externalReference },
        {
          label: "status (venta backend)",
          value: saleState.kind === "done" ? saleState.sale.status : null,
        },
        {
          label: "mpPaymentId",
          value:
            saleState.kind === "done" ? (saleState.sale.mpPaymentId ?? null) : null,
        },
      ]}
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
