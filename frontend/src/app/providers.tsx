"use client";

import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query";
import { AuthProvider } from "@/features/auth/authcontext";
import { CartProvider } from "@/features/landing/contexts/CartContext";
import { LoaderProvider } from "@/shared/components/loader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PendingToastListener from "@/shared/components/PendingToastListener";
import { APP_TOAST_ID } from "@/shared/utils/notifications";

export default function AppProviders({ children }: { children: ReactNode }) {
  const qc = getQueryClient();

  return (
    <QueryClientProvider client={qc}>
      <ToastContainer
        containerId={APP_TOAST_ID}
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        newestOnTop
        limit={3}
        style={{ zIndex: 999999 }}
      />

      <PendingToastListener />

      <AuthProvider>
        <LoaderProvider>
          <CartProvider>{children}</CartProvider>
        </LoaderProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
