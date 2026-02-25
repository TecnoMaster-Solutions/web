"use client";

import React from "react";
import Image from "next/image";
import { Check } from "lucide-react";

interface PaymentSuccessAlertProps {
  storeName?: string; // Ej: "SistemasPc"
  code?: string; // Ej: "RF-12345678"
}

const PaymentSuccessAlert: React.FC<PaymentSuccessAlertProps> = ({
  storeName = "SistemasPc",
  code = "RF-12345678",
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
        {/* Icono check */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 flex items-center justify-center rounded-full border-4 border-green-500">
            <Check size={50} strokeWidth={3} className="text-green-500" />
          </div>
        </div>

        {/* Texto principal */}
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Gracias por comprar en
        </h2>
        <p className="text-xl font-bold text-gray-900 mb-2">{storeName}</p>

        {/* Subtítulo */}
        <p className="text-gray-600 mb-5">
          Su compra será enviada en pocos días.
        </p>

        {/* Logo de Mercado Pago */}
        <div className="flex flex-col items-center mb-3">
          <Image
            src="/assets/imgs/mercadoPagoLogo.png"
            alt="Mercado Pago"
            width={140}
            height={60}
            priority
          />
          <p className="text-gray-700 text-sm mt-1">
            Código: <span className="font-semibold">{code}</span>
          </p>
        </div>

        {/* Estado final */}
        <p className="text-green-600 font-semibold text-lg mt-3">
          Pago exitoso
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessAlert;
