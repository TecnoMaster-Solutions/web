"use client";

import { getPublicRuntimeConfig } from "@/lib/runtime-config";
import MercadoPagoCheckoutButton from "./MercadoPagoCheckoutButton";
import type { MercadoPagoCheckoutPreferencePayload } from "../types";

function getAppBaseUrl() {
  const { appUrl } = getPublicRuntimeConfig();
  return appUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
}

function getApiBaseUrl() {
  return getPublicRuntimeConfig().apiUrl;
}

export default function MercadoPagoCheckoutExample() {
  const appBaseUrl = getAppBaseUrl();
  const apiBaseUrl = getApiBaseUrl();

  const payload: MercadoPagoCheckoutPreferencePayload = {
    items: [
      {
        id: "SERV-001",
        title: "Servicio técnico - Reparación de pantalla",
        description: "Atención en Colombia (COP)",
        quantity: 1,
        unitPrice: 180000,
      },
    ],
    backUrls: {
      success: `${appBaseUrl}/pago/exito`,
      failure: `${appBaseUrl}/pago/error`,
      pending: `${appBaseUrl}/pago/pendiente`,
    },
    notificationUrl: `${apiBaseUrl}/payments/mercado-pago/webhook`,
    externalReference: `WEB-${Date.now()}`,
    payer: {
      name: "Cliente",
      surname: "Demo",
      email: "cliente.demo@example.com",
    },
    metadata: {
      channel: "nextjs-web",
      country: "CO",
      currency: "COP",
    },
    autoReturnApproved: true,
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Mercado Pago Checkout Pro</h2>
      <p className="mt-2 text-sm text-slate-600">
        Genera la preference en tu backend NestJS y redirige automáticamente a Mercado Pago.
      </p>
      <div className="mt-4">
        <MercadoPagoCheckoutButton payload={payload} />
      </div>
    </section>
  );
}
