"use client";

import RequireAuth from "@/features/auth/requireauth";
import RegisterQuoteForm from "@/features/dashboard/quotes/components/RegisterQuote";
import { useRouter } from "next/navigation";

export default function QuotesRegisterPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <div className="p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold">Crear Cotización</h1>

          <button
            type="button"
            onClick={() => router.back()} 
            className="cursor-pointer px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Volver
          </button>
        </div>

        <RegisterQuoteForm redirectTo="/quotes" />
      </div>
    </RequireAuth>
  );
}
