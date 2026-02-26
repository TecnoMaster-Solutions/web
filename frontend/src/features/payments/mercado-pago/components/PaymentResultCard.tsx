import type { ReactNode } from "react";

type PaymentResultCardProps = {
  title: string;
  description: string;
  tone: "success" | "error" | "pending";
  details?: Array<{ label: string; value?: string | null }>;
  extra?: ReactNode;
};

const toneStyles: Record<PaymentResultCardProps["tone"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  pending: "border-amber-200 bg-amber-50 text-amber-900",
};

export default function PaymentResultCard({
  title,
  description,
  tone,
  details = [],
  extra,
}: PaymentResultCardProps) {
  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-white px-4 py-10">
      <div className={`mx-auto max-w-2xl rounded-2xl border p-6 shadow-sm ${toneStyles[tone]}`}>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm opacity-90">{description}</p>

        {details.length > 0 ? (
          <div className="mt-6 grid gap-3 rounded-xl bg-white/80 p-4 text-sm text-slate-800">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="flex flex-col gap-1 border-b border-slate-200 pb-2 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-slate-600">{detail.label}</span>
                <span className="font-semibold break-all">
                  {detail.value && detail.value.trim() ? detail.value : "No disponible"}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {extra ? <div className="mt-5">{extra}</div> : null}
      </div>
    </main>
  );
}
