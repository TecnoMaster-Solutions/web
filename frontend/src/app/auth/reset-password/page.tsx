"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { routes } from "@/shared/routes";
import { showError, showSuccess } from "@/shared/utils/notifications";
import { getApiErrorMessage } from "@/features/auth/utils/authUser";

function ResetPasswordPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const tokenFromUrl = useMemo(() => params.get("token") ?? "", [params]);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const safeToken = (token || tokenFromUrl).trim();
    if (!safeToken) {
      showError("Token invalido o ausente.");
      return;
    }

    if (!password.trim() || password.length < 8) {
      showError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      showError("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token: safeToken, password });
      showSuccess(
        "Contrasena actualizada correctamente. Ahora puedes iniciar sesion."
      );
      router.push(routes.auth.login);
    } catch (err: unknown) {
      showError(
        getApiErrorMessage(
          err,
          "El enlace no es valido o ha expirado. Solicita uno nuevo."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const showTokenField = !tokenFromUrl;

  return (
    <div className="min-h-screen bg-[#f6f3f3] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-16 w-16 rounded-2xl border border-[#d9e6dd] bg-white shadow-sm">
              <Image
                src="/assets/imgs/preview.png"
                alt="Logo Tecnomaster"
                fill
                className="object-contain p-1 rounded-2xl"
                priority
              />
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight bg-gradient-to-r from-[#04652c] via-[#06a646] to-[#2a9781] bg-clip-text text-transparent">
            Restaurar contrasena
          </h1>
          <p className="mt-2 text-sm text-[#3b5f73]">
            Crea una nueva contrasena para tu cuenta.
          </p>
        </div>

        <div className="rounded-2xl border border-[#d9e6dd] bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {showTokenField ? (
              <div>
                <label
                  htmlFor="token"
                  className="block text-sm font-medium text-neutral-800 mb-2"
                >
                  Token de recuperacion
                </label>
                <input
                  id="token"
                  type="text"
                  className="w-full rounded-xl border border-[#d9e6dd] bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-[#06a646] focus:ring-4 focus:ring-[#06a646]/15"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Pega aqui el token"
                />
              </div>
            ) : null}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-800 mb-2"
              >
                Nueva contrasena
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-xl border border-[#d9e6dd] bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-[#06a646] focus:ring-4 focus:ring-[#06a646]/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-neutral-800 mb-2"
              >
                Confirmar contrasena
              </label>
              <input
                id="confirm"
                type="password"
                className="w-full rounded-xl border border-[#d9e6dd] bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-[#06a646] focus:ring-4 focus:ring-[#06a646]/15"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contrasena"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#06a646] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#058a3c] active:bg-[#04652c] disabled:opacity-60 disabled:hover:bg-[#06a646]"
            >
              {loading ? "Guardando..." : "Guardar contrasena"}
            </button>

            <p className="text-xs text-[#3b5f73] leading-relaxed">
              Si el enlace expiro, solicita uno nuevo desde &quot;Recuperar
              contrasena&quot;.
            </p>
          </form>

          <div className="border-t border-[#d9e6dd] px-6 py-4 text-center">
            <Link
              href={routes.auth.login}
              className="text-sm font-medium text-[#04652c] hover:text-[#058a3c] hover:underline"
            >
              Volver al inicio de sesion
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} Tecnomaster
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f3f3]" />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
