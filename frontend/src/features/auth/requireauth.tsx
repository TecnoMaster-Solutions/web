"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/authcontext";
import { showError, showSuccess } from "@/shared/utils/notifications";

type Props = { children: React.ReactNode; loginPath?: string };

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function RequireAuth({
  children,
  loginPath = "/auth/login",
}: Props) {
  const { isAuthenticated, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) return;

    setRedirecting(true);

    const to = `${loginPath}?next=${encodeURIComponent(pathname)}`;
    router.replace(to);
  }, [ready, isAuthenticated, router, pathname, loginPath]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) return;
    if (typeof window === "undefined") return;

    const raw = sessionStorage.getItem("__pending_toast__");
    if (!raw) return;

    try {
      const t = JSON.parse(raw) as { type?: string; message?: string };
      const msg = String(t?.message ?? "").trim();
      if (!msg) return;

      if (t.type === "success") showSuccess(msg);
      else if (t.type === "error") showError(msg);
      else showSuccess(msg);
    } finally {
      sessionStorage.removeItem("__pending_toast__");
    }
  }, [ready, isAuthenticated]);

  if (!ready) {
    return (
      <div className="w-full h-[40vh] grid place-items-center text-gray-500">
        Cargando…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {redirecting && <Loader />}
        <div className="w-full h-[40vh] grid place-items-center text-gray-500">
          Redirigiendo…
        </div>
      </>
    );
  }

  return <>{children}</>;
}
