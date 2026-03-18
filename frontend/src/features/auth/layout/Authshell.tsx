"use client";

import type { ReactNode } from "react";

type Props = {
  mode?: "login" | "register";
  children: ReactNode;
};

export default function AuthShell({ mode = "login", children }: Props) {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
          <aside className="hidden border-r border-slate-200 bg-slate-50 p-8 md:flex md:flex-col md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
                Tecnomaster
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                {mode === "register" ? "Crear cuenta" : "Iniciar sesión"}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Gestiona solicitudes, cotizaciones y órdenes desde un solo lugar.
              </p>
            </div>
          </aside>

          <div className="p-6 md:p-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
