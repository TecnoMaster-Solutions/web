import { Suspense } from "react";
import PaymentSuccessPageContent from "@/features/payments/mercado-pago/components/PaymentSuccessPageContent";

export default function PagoExitoPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
