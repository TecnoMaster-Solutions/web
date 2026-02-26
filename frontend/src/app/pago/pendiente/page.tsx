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

export default function PagoPendientePage() {
  const searchParams = useSearchParams();
  const [sale, setSale] = useState<SalePaymentStatusResponse | null>(null);

  useEffect(() => {
    const saleId = getLastMercadoPagoSaleId();
    if (!saleId) return;
    void getSaleStatus(saleId).then(setSale).catch(() => null);
  }, []);

  return (
    <PaymentResultCard
      title="Pago pendiente"
      description="Mercado Pago reporta el pago como pendiente. La venta se marcará como pagada solo cuando el backend reciba aprobación."
      tone="pending"
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
