"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Nav from "@/features/landing/layout/Nav";
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
    <div className="min-h-screen w-full flex flex-col bg-[#f6f3f3] overflow-hidden">
      <Nav />

      <div className="flex flex-col lg:flex-row flex-1 px-6 lg:px-20 items-center justify-center gap-20 py-10">
        <div className="w-full lg:w-[45%] max-w-lg flex flex-col justify-center">
          <h1 className="text-[1.85rem] font-extrabold tracking-tight mb-1 text-center lg:text-left bg-gradient-to-r from-[#04652c] via-[#06a646] to-[#2a9781] bg-clip-text text-transparent">
            Restaurar contrasena
          </h1>

          <h2 className="text-sm font-medium text-[#3b5f73] mb-6">
            Configura una nueva clave
          </h2>

          <p className="text-sm font-medium text-[#3b5f73] mb-6 text-center lg:text-left">
            Crea una nueva contrasena para tu cuenta y vuelve a ingresar con
            normalidad.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {showTokenField ? (
              <div>
                <label
                  htmlFor="token"
                  className="font-semibold text-sm text-neutral-900"
                >
                  Token de recuperacion
                </label>
                <input
                  id="token"
                  type="text"
                  className="w-full h-11 mt-1 px-4 rounded-lg border bg-white outline-none focus:ring-2 focus:ring-[#06a646]"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Pega aqui el token"
                />
              </div>
            ) : null}

            <div>
              <label
                htmlFor="password"
                className="font-semibold text-sm text-neutral-900"
              >
                Nueva contrasena
              </label>
              <input
                id="password"
                type="password"
                className="w-full h-11 mt-1 px-4 rounded-lg border bg-white outline-none focus:ring-2 focus:ring-[#06a646]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="font-semibold text-sm text-neutral-900"
              >
                Confirmar contrasena
              </label>
              <input
                id="confirm"
                type="password"
                className="w-full h-11 mt-1 px-4 rounded-lg border bg-white outline-none focus:ring-2 focus:ring-[#06a646]"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contrasena"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 rounded-lg text-white font-semibold ${
                loading
                  ? "bg-[#6ecf94] cursor-not-allowed"
                  : "bg-[#06a646] hover:bg-[#058a3c]"
              }`}
            >
              {loading ? "Guardando..." : "Guardar contrasena"}
            </button>

            <p className="text-xs text-[#3b5f73] leading-relaxed">
              Si el enlace expiro, solicita uno nuevo desde &quot;Recuperar
              contrasena&quot;.
            </p>

            <p className="text-center text-sm">
              <Link
                href={routes.auth.login}
                className="text-gray-500 hover:text-[#04652c] hover:underline underline-offset-4 transition-colors duration-200"
              >
                Volver al inicio de sesion
              </Link>
            </p>
          </form>

          <p className="mt-8 text-center lg:text-left text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} Tecnomaster
          </p>
        </div>

        <div className="hidden lg:flex w-[48%] justify-center p-2">
          <div className="relative w-full max-w-[860px]">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#06a646]/10 via-transparent to-[#2a9781]/15 blur-2xl" />
            <Image
              src="/assets/imgs/ImageLogin.png"
              alt="Imagen de apoyo"
              width={860}
              height={860}
              className="relative rounded-xl object-contain"
            />
          </div>
        </div>
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
