"use client";

import { useState } from "react";
import {
  createPreferenceAndRedirect,
} from "../services/mercadoPagoCheckout.service";
import type { MercadoPagoCheckoutPreferencePayload } from "../types";

type MercadoPagoCheckoutButtonProps = {
  payload: MercadoPagoCheckoutPreferencePayload;
  className?: string;
  disabled?: boolean;
  label?: string;
  onError?: (error: unknown) => void;
};

export default function MercadoPagoCheckoutButton({
  payload,
  className,
  disabled,
  label = "Pagar ahora",
  onError,
}: MercadoPagoCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await createPreferenceAndRedirect(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible iniciar el pago con Mercado Pago.";

      setErrorMessage(message);
      onError?.(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={
          className ??
          "inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isLoading ? "Redirigiendo..." : label}
      </button>

      {errorMessage ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
