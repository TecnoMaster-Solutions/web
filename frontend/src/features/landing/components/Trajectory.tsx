import React from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { routes } from "@/shared/routes";

const Trajectory = () => {
  const checkItems = [
    "Certificación Internacional ISO",
    "Soporte 24/7 Personalizado",
    "Alianzas con Líderes Globales",
  ];

  return (
    <section className="relative py-16 px-6 sm:px-12 md:px-24 flex flex-col md:flex-row items-center gap-12 md:gap-16 bg-white overflow-hidden">
      {/* Imagen Principal (Izquierda) */}
      <div className="flex-1 flex justify-center relative w-full mb-8 md:mb-0">
        <div className="relative w-full max-w-sm sm:max-w-md md:max-w-xl aspect-square bg-gray-50 rounded-3xl shadow-lg border border-gray-100 overflow-hidden group">
          <Image
            src="/assets/imgs/camera.png"
            alt="Cámara de seguridad web"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            fill
          />
          {/* Decorative green shape */}
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#04652c]/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Texto (Derecha) */}
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#04652c] mb-6 tracking-tight leading-tight">
          ¡Conoce nuestra <br className="hidden lg:block" /> Trayectoria!
        </h2>
        <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
          Más de 20 años brindando seguridad y soporte técnico especializado con los más altos estándares de calidad en el mercado. En TecnoMaster nos especializamos en infraestructura crítica y protección de activos digitales.
        </p>

        {/* Lista de checks */}
        <ul className="mb-10 space-y-4 text-left inline-block md:block max-w-md">
          {checkItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3 text-gray-700 font-medium text-lg">
              <CheckCircle2 className="text-[#04652c] w-6 h-6 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            window.location.href = routes.landing.trajectory;
          }}
          className="relative inline-flex items-center justify-center px-8 py-3.5 text-lg font-semibold text-white rounded-lg shadow-md overflow-hidden bg-[#04652c] hover:bg-[#06a646] transition-colors hover:shadow-xl hover:-translate-y-1 duration-300"
        >
          Saber Más
        </button>
      </div>
    </section>
  );
};

export default Trajectory;
