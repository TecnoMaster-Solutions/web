"use client";

import React from "react";
import { X } from "lucide-react";
import Image from "next/image";
import Swal from "sweetalert2";
import Colors from "@/shared/theme/colors";
import Nav from "../layout/Nav";

const PaymentMethod = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    Swal.fire({
      html: `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;">
      <!-- Círculo blanco con borde verde -->
      <div style="width:100px;height:100px;display:flex;align-items:center;justify-content:center;border:4px solid #11b740;border-radius:50%;background-color:white;">
        <!-- Chulito verde -->
        <svg xmlns="http://www.w3.org/2000/svg" width="55" height="55" fill="#11b740" viewBox="0 0 24 24">
          <path d="M20.285 6.709l-11.285 11.291-5.285-5.3 1.415-1.414 3.87 3.885 9.87-9.885z"/>
        </svg>
      </div>

      <h2 style="font-size:1.25rem;font-weight:700;color:#111;margin:12px 0 0;">Gracias por comprar en</h2>
      <p style="font-size:1.1rem;font-weight:700;margin:0;color:#111;">SistemasPc</p>
      <p style="font-size:0.95rem;color:#444;margin-top:4px;">Su compra será enviada en pocos días.</p>

      <img src="/assets/imgs/mercadoPagoLogo.png" width="130" height="60" style="margin-top:10px;" alt="Mercado Pago"/>

      <p style="font-size:0.9rem;margin-top:5px;color:#333;">Código: <b>RF-12345678</b></p>
      <p style="font-size:1rem;font-weight:600;color:#11b740;margin-top:6px;">Pago exitoso</p>
    </div>
  `,
      showConfirmButton: true,
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#11b740",
      background: "#fff",
      color: "#111",
      width: "360px",
      customClass: {
        popup: "rounded-xl shadow-lg border border-gray-200 font-sans",
        confirmButton:
          "cursor-pointer px-5 py-2.5 rounded-md font-semibold text-white text-sm transition hover:scale-105",
      },
    }).then(() => {
      // ✅ Redirección al home
      window.location.href = "/";
    });
  };

  return (
    <>
      <Nav />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
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
