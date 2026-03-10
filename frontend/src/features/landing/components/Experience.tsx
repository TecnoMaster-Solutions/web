"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Nav from "@/features/landing/layout/Nav";
import Footer from "@/features/landing/layout/Footer";
import { routes } from "@/shared/routes";

const TimelineItem = ({
  year,
  title,
  description,
  alignment,
  extra,
}: {
  year: string;
  title: string;
  description: string;
  alignment: "left" | "right";
  extra?: React.ReactNode;
}) => {
  const isLeft = alignment === "left";

  return (
    <div className="relative w-full mb-28 group">
      {/* Mobile Badge / Dot */}
      <div className="md:hidden flex items-center mb-6 pl-4 relative z-20">
        <div className="bg-[#1a1a1a] text-white text-xs font-bold py-1 px-3 rounded shadow-md mr-4 whitespace-nowrap">
          {year}
        </div>
        <div className="w-3 h-3 rounded-full bg-[#04652c] shadow-sm"></div>
      </div>

      {/* Desktop Line Element (Dot + Badge) vertically centered with card */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 w-full flex-row items-center justify-center pointer-events-none z-20">
        <div className="relative flex w-full justify-center items-center">
          {isLeft ? (
            <>
              {/* Center Dot */}
              <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#04652c] shadow-sm z-20 border-2 border-transparent"></div>
              {/* Badge on Right */}
              <div className="absolute left-[calc(50%+30px)] bg-[#1a1a1a] text-white text-sm font-bold py-1.5 px-4 rounded shadow-md whitespace-nowrap z-20 pointer-events-auto">
                {year}
              </div>
            </>
          ) : (
            <>
              {/* Badge on Left */}
              <div className="absolute right-[calc(50%+30px)] bg-[#1a1a1a] text-white text-sm font-bold py-1.5 px-4 rounded shadow-md whitespace-nowrap z-20 pointer-events-auto">
                {year}
              </div>
              {/* Center Dot */}
              <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#04652c] shadow-sm z-20 border-2 border-transparent"></div>
            </>
          )}
        </div>
      </div>

      {/* Card Content Row */}
      <div
        className={`flex w-full ${isLeft ? "md:justify-start" : "md:justify-end"
          }`}
      >
        <div className="w-full md:w-[45%] px-4 md:px-0 relative z-10">
          <div
            className={`bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border-[#04652c] border-l-[4px] ${isLeft ? "md:border-l-0 md:border-r-[4px] md:mr-8" : "md:ml-8"
              }`}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed text-[15px]">
              {description}
            </p>
            {extra && <div className="mt-4">{extra}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const Experience = () => {
  const router = useRouter();

  const handleReturn = () => {
    router.push(routes.path);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f7f0] font-sans">
      <Nav />

      <main className="flex-grow flex flex-col items-center w-full">
        {/* HERO SECTION */}
        <div className="w-full bg-gradient-to-b from-white to-[#f0f7f0]">
          <section className="w-full pt-16 pb-24 px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold text-[#04652c] tracking-tight mb-6 mt-4">
              Nuestra Trayectoria
            </h1>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-10 max-w-2xl">
              Conoce la historia detrás de TecnoMaster, desde nuestros inicios
              hasta convertirnos en referentes de soluciones tecnológicas.
            </p>
            <button
              onClick={handleReturn}
              className="px-6 py-2.5 rounded-md font-semibold text-[#04652c] border-2 border-[#04652c] bg-white hover:bg-[#06a646] hover:border-[#06a646] hover:text-white transition-all duration-300 shadow-sm flex items-center gap-2"
            >
              <span>&larr;</span> Volver
            </button>
          </section>
        </div>

        {/* TIMELINE SECTION */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative pb-20">
          {/* Vertical Green Line for Desktop - Continuous */}
          <div className="absolute left-10 md:left-1/2 top-0 bottom-12 w-[2px] bg-[#04652c] -translate-x-1/2 hidden md:block z-0"></div>

          {/* HISTORIA DEL FUNDADOR */}
          <div className="w-full relative z-10 pt-10">
            <div className="text-center mb-16 bg-[#f0f7f0] inline-block relative left-1/2 -translate-x-1/2 px-4 z-20">
              <h2 className="text-2xl md:text-3xl font-bold text-[#04652c] relative inline-block">
                Historia del Fundador
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#04652c] rounded-full"></div>
              </h2>
            </div>

            <div className="mt-10">
              <TimelineItem
                year="2004"
                title="Inicios profesionales"
                description="Terminé mis estudios de tecnólogo en sistemas y comencé mi vida laboral en empresas como Occel Celular, Hard Computer, Clínica de Occidente, Hospital Manuel Uribe Ángel, Clínica de Fracturas, Clínica de Oftalmología, entre otras. Brindaba asesoría, asistencia y soporte técnico a equipos de cómputo, servidores, impresoras, plotters, redes y sistemas de monitoreo."
                alignment="right" // Right side for 2004
              />
              <TimelineItem
                year="2012"
                title="Independencia laboral"
                description="Entre 2009 y 2011 decidí independizarme y en 2012-2013 inicié con compañeros de universidad un proyecto para atender clientes y empresas en servicios de sistemas. La empresa nació con una inversión de 50 mil pesos en publicidad y visitas a empresas."
                alignment="left" // Left side for 2012
              />
            </div>
          </div>

          {/* HISTORIA DE LA EMPRESA */}
          <div className="w-full relative z-10 mt-10">
            <div className="text-center mb-16 bg-[#f0f7f0] inline-block relative left-1/2 -translate-x-1/2 px-4 z-20">
              <h2 className="text-2xl md:text-3xl font-bold text-[#04652c] relative inline-block">
                Historia de la Empresa
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#04652c] rounded-full"></div>
              </h2>
            </div>

            <div className="mt-10">
              <TimelineItem
                year="2015-2022"
                title="Expansión empresarial"
                description="SistemasPC prestaba servicios a más de 15 empresas reconocidas en Medellín como Futuro SAS, Carwill, Ferretería Nachos, Abogados de Bancolombia, Clínica Medellín, Corficolombiana, Colmena, alcaldías de Sopetrán y La Ceja, entre otras. Un proceso que inició con dos compañeros de universidad y fue creciendo con el tiempo."
                alignment="right" // Right side for 2015-2022
              />
              <TimelineItem
                year="2025"
                title="Actualidad"
                description="Hoy seguimos prestando servicios de mantenimiento y reparación de equipos de cómputo e impresoras, mantenimiento de redes y servidores, y sistemas de monitoreo (CCTV). Trabajamos con nuevas empresas y tecnologías para optimizar procesos internos."
                alignment="left" // Left side for 2025
                extra={
                  <div className="text-sm font-bold text-gray-800 leading-snug mt-4">
                    <p>Medellín, Septiembre 11 del 2025</p>
                    <p>Contacto: Pedro Pablo Córdoba G.</p>
                    <p>Cel: 313 685 09 68 / 315 353 49 94</p>
                    <p className="text-[#04652c]">sistemaspcg@gmail.com</p>
                  </div>
                }
              />
            </div>
          </div>

          {/* FINAL BUTTON */}
          <div className="flex justify-center mt-12 bg-[#f0f7f0] relative z-20 py-4">
            <button
              onClick={scrollToTop}
              className="px-8 py-3 rounded-md font-semibold text-[#04652c] border-2 border-[#04652c] hover:bg-[#06a646] hover:border-[#06a646] hover:text-white transition-all duration-300 shadow-sm"
            >
              Volver al inicio
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Experience;
