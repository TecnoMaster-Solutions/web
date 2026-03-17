"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ToastOptions } from "react-toastify";
import {
  showError,
  showInfo,
  showSuccess,
  showWarning,
} from "@/shared/utils/notifications";

type PendingToastPayload = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  options?: ToastOptions;
};

const KEY = "__pending_toast__";

export default function PendingToastListener() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Never show deferred toasts on auth routes (e.g., after logout redirect).
    if (pathname?.startsWith("/auth")) {
      sessionStorage.removeItem(KEY);
      return;
    }

    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as PendingToastPayload;
      sessionStorage.removeItem(KEY);

      if (!payload?.type || !payload?.message) return;

      if (payload.type === "success") showSuccess(payload.message, payload.options);
      else if (payload.type === "error") showError(payload.message, payload.options);
      else if (payload.type === "warning") showWarning(payload.message, payload.options);
      else showInfo(payload.message, payload.options);
    } catch {
      sessionStorage.removeItem(KEY);
    }
  }, [pathname]);

  return null;
}
