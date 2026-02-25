"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLoader } from "@/shared/components/loader";
import LoginForm from "@/features/auth/login/login";
import RegisterForm from "@/features/auth/register/RegisterPage";
import AuthShell from "@/features/auth/layout/Authshell";
import { routes } from "@/shared/routes";

export default function AccessPage() {
  const { hideLoader } = useLoader();

  useEffect(() => hideLoader(), [hideLoader]);

  const [mode, setMode] = useState<"login" | "register">(() => {
    if (typeof window === "undefined") return "login";
    const p = new URLSearchParams(window.location.search).get("mode");
    return p === "register" ? "register" : "login";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("mode", mode);
    window.history.replaceState(null, "", url.toString());
  }, [mode]);

  return (
    <>
      <Link
        href={routes.path}
        className="fixed left-6 top-6 z-30 inline-flex h-9 items-center rounded-md bg-white/85 px-3 text-sm shadow backdrop-blur hover:bg-white"
      >
        ← Volver
      </Link>

      <AuthShell mode={mode}>
        {mode === "login" ? (
          <LoginForm onSwitch={() => setMode("register")} />
        ) : (
          <RegisterForm onSwitch={() => setMode("login")} />
        )}
      </AuthShell>
    </>
  );
}
