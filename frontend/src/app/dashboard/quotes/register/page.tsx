"use client";

import RequireAuth from "@/features/auth/requireauth";
import RegisterQuoteForm from "@/features/dashboard/quotes/components/RegisterQuote";
import { createQuote } from "@/features/dashboard/quotes/api/quotes.api";
import { QuoteCreatePayload } from "@/features/dashboard/quotes/types/Quote.type";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export default function QuotesRegisterPage() {
  const router = useRouter();
  const { canCreate } = usePermissions();
  const canCreateQuotes = canCreate("quotes");

  const handleSave = async (payload: QuoteCreatePayload) => {
    if (!canCreateQuotes) return;
    await createQuote(payload);
    router.push("/dashboard/quotes");
  };

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

        {!canCreateQuotes ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-gray-500">
              No tienes permisos para crear cotizaciones.
            </span>
          </div>
        ) : (
          <RegisterQuoteForm onSave={handleSave} />
        )}
      </div>
    </RequireAuth>
  );
}
