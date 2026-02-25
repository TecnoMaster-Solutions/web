"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/authcontext";
import Nav from "@/features/landing/layout/Nav";
import { showError } from "@/shared/utils/notifications";
import { routes } from "@/shared/routes";

type FormState = {
  email: string;
  password: string;
};

type FormErrors = {
  email: string;
  password: string;
};

type FormTouched = {
  email: boolean;
  password: boolean;
};

const emptyErrors: FormErrors = { email: "", password: "" };
const emptyTouched: FormTouched = { email: false, password: false };

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [touched, setTouched] = useState<FormTouched>(emptyTouched);

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    const v = value.trim();
    if (!v) return "El correo electrónico es obligatorio";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
    if (!ok) return "Ingresa un correo electrónico válido";
    return "";
  };

  const validatePassword = (value: string) => {
    const v = value.trim();
    if (!v) return "La contraseña es obligatoria";
    return "";
  };

  const validateField = (name: keyof FormState, value: string) => {
    if (name === "email") return validateEmail(value);
    if (name === "password") return validatePassword(value);
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
      password: validatePassword(form.password),
    };
    setErrors(nextErrors);
    setTouched({ email: true, password: true });
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const ok = validateAll();
    if (!ok) return;

    const next = searchParams.get("next");

    setLoading(true);
    const result = await login(form.email.trim(), form.password.trim(), next);
    setLoading(false);

    if (!result.ok) {
      showError(result.message || "Correo o contraseña incorrectos.");
      return;
    }

    if (!result.redirectTo) {
      showError("Tu rol no tiene acceso a ningún módulo disponible.");
      return;
    }

    router.replace(result.redirectTo);
  };

  const emailHasError = !!errors.email && touched.email;
  const passHasError = !!errors.password && touched.password;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f6f3f3] overflow-hidden">
      <Nav />

      <div className="flex flex-col lg:flex-row flex-1 px-6 lg:px-20 items-center justify-center gap-20">
        <div className="w-full lg:w-[45%] max-w-lg flex flex-col justify-center">
          <h2 className="text-3xl font-black mb-2 text-center lg:text-left">
            Bienvenido a Sistemas PC
          </h2>

          <p className="text-gray-600 mb-6 text-center lg:text-left">
            Ingresa tus datos para continuar.
          </p>

          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-semibold text-sm">Email</label>
              <input
                type="text"
                inputMode="email"
                className={`w-full h-11 mt-1 px-4 rounded-lg border bg-white outline-none ${
                  emailHasError
                    ? "border-red-500 focus:ring-2 focus:ring-red-400"
                    : "focus:ring-2 focus:ring-red-400"
                }`}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => touchField("email")}
                placeholder="Ingresa tu correo"
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

            <div>
              <label className="font-semibold text-sm">Contraseña</label>
              <div
                className={`flex items-center mt-1 w-full rounded-lg border bg-white overflow-hidden ${
                  passHasError ? "border-red-500" : ""
                }`}
              >
                <input
                  type={show ? "text" : "password"}
                  className="flex-1 h-11 px-4 outline-none bg-white"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  onBlur={() => touchField("password")}
                  placeholder="Ingrese su contraseña"
                  autoComplete="current-password"
                  aria-invalid={passHasError}
                  aria-describedby={passHasError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="px-3 hover:bg-gray-100 flex items-center justify-center"
                >
                  <Image
                    src={show ? "/icons/eye-off.svg" : "/icons/Eye.svg"}
                    alt="Mostrar/Ocultar contraseña"
                    width={22}
                    height={22}
                  />
                </button>
              </div>
              {passHasError ? (
                <p id="password-error" className="mt-1 text-xs text-red-600">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 rounded-lg text-white font-semibold ${
                loading
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-red-700 hover:bg-red-800"
              }`}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="flex flex-col items-center mt-3">
            <p className="mt-4 text-center text-sm">
              <Link
                href={routes.auth.forgotPassword}
                className="text-gray-500 hover:text-red-700 hover:underline underline-offset-4 transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>

            <p className="mt-2 text-sm">
              ¿No tienes cuenta?{" "}
              <Link href="/auth/register" className="text-red-700 font-semibold">
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>

        <div className="hidden lg:flex w-[40%] justify-center p-6">
          <Image
            src="/assets/imgs/previewSinFondo.png"
            alt="Imagen de apoyo"
            width={520}
            height={520}
            className="rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}
