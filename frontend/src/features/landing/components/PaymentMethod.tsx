"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import Colors from "@/shared/theme/colors";
import Nav from "../layout/Nav";
import PaymentSuccessAlert from "./PaymentSuccessAlert"; // 👈 Importamos la alerta

const PaymentMethod = () => {
  const [showSuccess, setShowSuccess] = useState(false); // 👈 Estado para mostrar la alerta

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulamos que el pago fue exitoso
    setShowSuccess(true);
  };

  return (
    <>
      <Nav />

      {/* Si showSuccess es true, mostramos la alerta */}
      {showSuccess && (
        <PaymentSuccessAlert storeName="SistemasPc" code="RF-12345678" />
      )}

      <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
        {/* Card principal */}
        <div className="relative bg-white w-full max-w-sm rounded-lg shadow-xl p-6">
          {/* Botón cerrar */}
          <button
            className="cursor-pointer absolute top-4 right-4 text-gray-700 hover:text-black transition"
            onClick={() => window.history.back()}
          >
            <X size={22} />
          </button>

          {/* Logo Mercado Pago */}
          <div className="flex justify-center mb-2">
            <Image
              src="/assets/imgs/mercadoPagoLogo.png"
              alt="Mercado Pago"
              width={150}
              height={80}
              priority
            />
          </div>

          {/* Título */}
          <h2 className="text-lg sm:text-xl font-semibold text-center text-gray-900 mb-5">
            Agrega un método de pago
          </h2>

          {/* Formulario */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Número de tarjeta */}
            <div className="relative">
              <input
                type="text"
                placeholder="Número de tarjeta"
                className="w-full border rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:ring-1 focus:ring-[#E11900] focus:border-[#E11900] outline-none"
              />
              {/* Logo Visa */}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#0040FF] font-semibold select-none">
                VISA
              </span>
            </div>

            {/* Nombre */}
            <input
              type="text"
              placeholder="Como figura en la tarjeta"
              className="w-full border rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:ring-1 focus:ring-[#E11900] focus:border-[#E11900] outline-none"
            />

            {/* Fecha y Código de seguridad */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="MM/AA"
                className="w-1/2 border rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:ring-1 focus:ring-[#E11900] focus:border-[#E11900] outline-none"
              />
              <input
                type="text"
                placeholder="Cód. de seguridad"
                className="w-1/2 border rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:ring-1 focus:ring-[#E11900] focus:border-[#E11900] outline-none"
              />
            </div>

            {/* Código postal */}
            <input
              type="text"
              placeholder="Código postal"
              className="w-full border rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:ring-1 focus:ring-[#E11900] focus:border-[#E11900] outline-none"
            />

            {/* Botón Guardar */}
            <button
              type="submit"
              style={{ backgroundColor: Colors.buttons.primary }}
              className="cursor-pointer w-full py-2 mt-2 text-white font-medium rounded-md hover:bg-[#c01000] transition-transform hover:scale-[1.02]"
            >
              Guardar
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default PaymentMethod;
