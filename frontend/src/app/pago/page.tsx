import MercadoPagoCheckoutExample from "@/features/payments/mercado-pago/components/MercadoPagoCheckoutExample";

export default function PagoPage() {
  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-white px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <MercadoPagoCheckoutExample />
      </div>
    </main>
  );
}
