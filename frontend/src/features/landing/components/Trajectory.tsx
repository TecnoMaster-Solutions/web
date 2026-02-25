import React from "react";
import Image from "next/image";
import Colors from "@/shared/theme/colors";
import { routes } from "@/shared/routes";

const Trajectory = () => {
  return (
    <section className="relative py-10 px-4 sm:px-10 md:px-20 flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-12 overflow-hidden">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 -z-2">
        <Image
          src="/assets/imgs/trajectory.webp"
          alt="Cohete Startup"
          fill
          className="object-cover opacity-40"
          priority
        />
        {/* Degradado para combinar con fondo blanco */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
      </div>

      {/* Texto */}
      <div className="flex-1 relative z-10 text-center md:text-left">
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-red-700 mb-6 md:mb-8 leading-tight">
          ¡Conoce nuestra <br className="hidden sm:block" /> Trayectoria!
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 md:mb-8 leading-relaxed">
          Con más de 20 años de experiencia,{" "}
          <span className="font-semibold">Tech Solutions</span> se ha
          consolidado como líder en soluciones tecnológicas. Hemos ayudado a
          cientos de empresas a crecer y optimizar sus operaciones a través de
          la tecnología.
        </p>
        <button
          style={{ backgroundColor: Colors.buttons.primary }}
          onClick={() => {
            window.location.href = routes.landing.trajectory;
          }}
          className="relative cursor-pointer inline-flex items-center justify-center px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold text-white rounded-md shadow-lg overflow-hidden group transition-transform duration-300 hover:scale-105"
        >
          <span className="absolute inset-0 bg-red-800 scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
            Ver más
          </span>
        </button>
      </div>

      {/* Imagen principal */}
      <div className="flex-1 flex justify-center relative z-15 w-full">
        <Image
          src="/assets/imgs/camera.png"
          alt="Cámara de seguridad"
          className="rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-2xl object-cover"
          width={700}
          height={700}
        />
      </div>
    </section>
  );
};

export default Trajectory;
