"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  showError,
  showInfo,
  showSuccess,
  showWarning,
} from "@/shared/utils/notifications";

type PendingToastPayload = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  options?: any;
};

const KEY = "__pending_toast__";

export default function PendingToastListener() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

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
