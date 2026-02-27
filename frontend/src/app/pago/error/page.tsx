"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PaymentResultCard from "@/features/payments/mercado-pago/components/PaymentResultCard";
import {
  getLastMercadoPagoSaleId,
  getSaleStatus,
} from "@/features/payments/mercado-pago/services/mercadoPagoCheckout.service";
import type { SalePaymentStatusResponse } from "@/features/payments/mercado-pago/types";

const normalizeMpParam = (value: string | null) =>
  !value || value === "null" ? null : value;

export default function PagoErrorPage() {
  const searchParams = useSearchParams();
  const [sale, setSale] = useState<SalePaymentStatusResponse | null>(null);

  useEffect(() => {
    const saleId = getLastMercadoPagoSaleId();
    if (!saleId) return;
    void getSaleStatus(saleId).then(setSale).catch(() => null);
  }, []);

  return (
    <PaymentResultCard
      title="Pago no completado"
      description="La transacción no fue aprobada. Revisa el estado real de la venta antes de reintentar."
      tone="error"
      details={[
        { label: "saleId", value: sale ? String(sale.saleId) : null },
        { label: "status (venta backend)", value: sale?.status ?? null },
        {
          label: "payment_id / collection_id",
          value:
            normalizeMpParam(searchParams.get("payment_id")) ??
            normalizeMpParam(searchParams.get("collection_id")),
        },
        {
          label: "status (query)",
          value:
            normalizeMpParam(searchParams.get("status")) ??
            normalizeMpParam(searchParams.get("collection_status")),
        },
        {
          label: "external_reference",
          value: normalizeMpParam(searchParams.get("external_reference")),
        },
      ]}
    />
  );
}
