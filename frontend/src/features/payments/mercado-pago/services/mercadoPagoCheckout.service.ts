import { apiClient } from "@/shared/utils/apiClient";
import type {
  MercadoPagoPaymentConfirmation,
  MercadoPagoCheckoutPreferencePayload,
  MercadoPagoCheckoutPreferenceResponse,
  MercadoPagoSaleCheckoutRequest,
  MercadoPagoSaleCheckoutResponse,
  SalePaymentStatusResponse,
} from "../types";

const CHECKOUT_SALES_PATH = "/sales/checkout/mercadopago";
const SALES_PATH = "/sales";
const VERIFY_PATH = "/payments/mercado-pago/verify";
const PREFERENCES_PATH = "/payments/mercado-pago/preferences";
const LAST_SALE_ID_KEY = "mp_last_sale_id";

type CheckoutWindowOptions = {
  popupWindow?: Window | null;
};

export function resolveMercadoPagoCheckoutUrl(
  response: Pick<MercadoPagoSaleCheckoutResponse, "initPoint" | "sandboxInitPoint">
): string {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const target = isDevelopment ? response.sandboxInitPoint : response.initPoint;

  if (!target) {
    throw new Error(
      isDevelopment
        ? "La API no devolvió sandboxInitPoint para desarrollo."
        : "La API no devolvió initPoint para producción."
    );
  }

  return target;
}

export async function createMercadoPagoPreference(
  payload: MercadoPagoCheckoutPreferencePayload
): Promise<MercadoPagoCheckoutPreferenceResponse> {
  return apiClient.post<MercadoPagoCheckoutPreferenceResponse>(PREFERENCES_PATH, payload);
}

export async function createSaleCheckoutMercadoPago(
  payload: MercadoPagoSaleCheckoutRequest
): Promise<MercadoPagoSaleCheckoutResponse> {
  return apiClient.post<MercadoPagoSaleCheckoutResponse>(CHECKOUT_SALES_PATH, payload);
}

export function saveLastMercadoPagoSaleId(saleId: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SALE_ID_KEY, String(saleId));
}

export function getLastMercadoPagoSaleId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LAST_SALE_ID_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function createSaleCheckoutAndRedirect(
  payload: MercadoPagoSaleCheckoutRequest,
  options?: CheckoutWindowOptions
) {
  const checkout = await createSaleCheckoutMercadoPago(payload);
  saveLastMercadoPagoSaleId(checkout.saleId);

  const checkoutUrl = resolveMercadoPagoCheckoutUrl(checkout);
  if (typeof window === "undefined") {
    throw new Error("La redirección solo puede ejecutarse en cliente.");
  }

  const preOpenedWindow = options?.popupWindow ?? null;
  if (preOpenedWindow && !preOpenedWindow.closed) {
    preOpenedWindow.location.href = checkoutUrl;
    preOpenedWindow.focus();
    return;
  }

  const checkoutWindow = window.open(checkoutUrl, "_blank");

  if (!checkoutWindow) {
    throw new Error(
      "El navegador bloqueó la ventana emergente. Habilita popups para abrir Mercado Pago en otra ventana."
    );
  }
}

export async function createPreferenceAndRedirect(
  payload: MercadoPagoCheckoutPreferencePayload,
  options?: CheckoutWindowOptions
) {
  const preference = await createMercadoPagoPreference(payload);
  const checkoutUrl = resolveMercadoPagoCheckoutUrl(preference);

  if (typeof window === "undefined") {
    throw new Error("La redirección solo puede ejecutarse en cliente.");
  }

  const preOpenedWindow = options?.popupWindow ?? null;
  if (preOpenedWindow && !preOpenedWindow.closed) {
    preOpenedWindow.location.href = checkoutUrl;
    preOpenedWindow.focus();
    return;
  }

  const checkoutWindow = window.open(checkoutUrl, "_blank");

  if (!checkoutWindow) {
    throw new Error(
      "El navegador bloqueó la ventana emergente. Habilita popups para abrir Mercado Pago en otra ventana."
    );
  }
}

export function openMercadoPagoCheckoutPlaceholderWindow() {
  if (typeof window === "undefined") return null;

  const popup = window.open("", "_blank");
  if (popup && !popup.closed) {
    try {
      popup.document.write(
        `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mercado Pago</title>
    <style>
      html, body {
        height: 100%;
        margin: 0;
      }
      body {
        font-family: Arial, sans-serif;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .wrap {
        position: relative;
        width: 96px;
        height: 96px;
        display: grid;
        place-items: center;
      }
      .spinner {
        width: 64px;
        height: 64px;
        border: 4px solid #dc2626;
        border-top-color: transparent;
        border-radius: 9999px;
        animation: spin 1s linear infinite;
        z-index: 2;
      }
      .pulse {
        position: absolute;
        width: 80px;
        height: 80px;
        border: 4px solid #f87171;
        border-radius: 9999px;
        animation: pulse 1.5s ease-in-out infinite;
        z-index: 1;
      }
      .label {
        position: absolute;
        top: calc(50% + 70px);
        left: 50%;
        transform: translateX(-50%);
        color: #fff;
        font-size: 14px;
        white-space: nowrap;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        70% { transform: scale(1.4); opacity: 0; }
        100% { transform: scale(1.4); opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div class="wrap" aria-live="polite" aria-label="Abriendo Mercado Pago">
      <div class="pulse"></div>
      <div class="spinner"></div>
      <div class="label">Abriendo Mercado Pago...</div>
    </div>
  </body>
</html>`
      );
      popup.document.close();
    } catch {
      // Si el navegador impide escribir el documento, igual conservamos la referencia.
    }
  }
  return popup;
}

export async function getSaleStatus(saleId: number) {
  const sale = await apiClient.get<Record<string, unknown>>(`${SALES_PATH}/${saleId}`);

  return {
    saleId: Number(sale.saleId ?? sale.saleid ?? saleId),
    status: String(sale.status ?? "PENDING") as SalePaymentStatusResponse["status"],
    totalAmount: Number(sale.totalAmount ?? sale.totalamount ?? 0),
    currency: String(sale.currency ?? "COP"),
    mpPreferenceId: (sale.mpPreferenceId as string | null | undefined) ?? null,
    mpPaymentId: (sale.mpPaymentId as string | null | undefined) ?? null,
    externalReference: (sale.externalReference as string | null | undefined) ?? null,
    rawSaleStatus: (sale.rawSaleStatus as string | null | undefined) ?? (sale.salestatus as string | null | undefined) ?? null,
    mpPaymentStatus: (sale.mpPaymentStatus as string | null | undefined) ?? null,
  };
}

export async function getSaleById(saleId: number) {
  return apiClient.get<Record<string, unknown>>(`${SALES_PATH}/${saleId}`);
}

export async function verifyMercadoPagoPayment(paymentId: string) {
  return apiClient.get<MercadoPagoPaymentConfirmation>(
    `${VERIFY_PATH}?paymentId=${encodeURIComponent(paymentId)}`
  );
}
