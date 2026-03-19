"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import Nav from "@/features/landing/layout/Nav";
import { routes } from "@/shared/routes";
import { showError, showSuccess } from "@/shared/utils/notifications";
import { getApiErrorMessage } from "@/features/auth/utils/authUser";

type FormState = { email: string };
type FormErrors = { email: string };
type FormTouched = { email: boolean };

const emptyErrors: FormErrors = { email: "" };
const emptyTouched: FormTouched = { email: false };

export default function ForgotPasswordPage() {
  const [form, setForm] = useState<FormState>({ email: "" });
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [touched, setTouched] = useState<FormTouched>(emptyTouched);
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    const v = value.trim();
    if (!v) return "El correo electronico es obligatorio";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
    if (!ok) return "Ingresa un correo electronico valido";
    return "";
  };

  const validateField = (name: keyof FormState, value: string) => {
    if (name === "email") return validateEmail(value);
    return "";
  };

  const setField = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const touchField = (name: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, form[name]);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const validateAll = () => {
    const nextErrors: FormErrors = {
      email: validateEmail(form.email),
    };
    setErrors(nextErrors);
    setTouched({ email: true });
    return !nextErrors.email;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const ok = validateAll();
    if (!ok) return;

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: form.email.trim() });
      showSuccess(
        "Si el correo existe en nuestro sistema, te enviaremos un enlace para restablecer tu contrasena."
      );
      setForm({ email: "" });
      setErrors(emptyErrors);
      setTouched(emptyTouched);
    } catch (err: unknown) {
      showError(
        getApiErrorMessage(
          err,
          "No se pudo procesar la solicitud. Intenta de nuevo."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const emailHasError = !!errors.email && touched.email;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f6f3f3] overflow-hidden">
      <Nav />

      <div className="flex flex-col lg:flex-row flex-1 px-6 lg:px-20 items-center justify-center gap-20 py-10">
        <div className="w-full lg:w-[45%] max-w-lg flex flex-col justify-center">
          <h1 className="text-[1.85rem] font-extrabold tracking-tight mb-1 text-center lg:text-left bg-gradient-to-r from-[#04652c] via-[#06a646] to-[#2a9781] bg-clip-text text-transparent">
            Recuperar contrasena
          </h1>

          <h2 className="text-sm font-medium text-[#3b5f73] mb-6">
            Recupera el acceso a tu cuenta
          </h2>

          <p className="text-sm font-medium text-[#3b5f73] mb-6 text-center lg:text-left">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contrasena.
          </p>

          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="font-semibold text-sm text-neutral-900"
              >
                Correo electronico
              </label>
              <input
                id="email"
                type="text"
                inputMode="email"
                className={`w-full h-11 mt-1 px-4 rounded-lg border bg-white outline-none ${
                  emailHasError
                    ? "border-red-500 focus:ring-2 focus:ring-red-400"
                    : "focus:ring-2 focus:ring-[#06a646]"
                }`}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => touchField("email")}
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                aria-invalid={emailHasError}
                aria-describedby={emailHasError ? "email-error" : undefined}
              />

              {emailHasError ? (
                <p id="email-error" className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              ) : null}
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
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>

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
