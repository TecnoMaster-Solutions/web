"use client";
import React from "react";
import Nav from "@/features/landing/layout/Nav";

const Experience = () => {
  return (
    <>
      <Nav />
      <section className="relative w-full min-h-screen flex justify-center items-center bg-gray-100 p-5">
        <main className="bg-white shadow-2xl rounded-xl flex flex-col w-full max-w-4xl p-10 space-y-12">
          {/* HISTORIA DEL FUNDADOR */}
          <div>
            <h2 className="text-2xl font-bold text-center text-[#B20000] mb-6">
              Historia del Fundador
            </h2>

            {/* Item */}
            <div className="flex flex-row w-full mt-5">
              <div className="relative w-auto mr-4">
                <div className="absolute -left-12 bg-black text-white text-xs rounded-r-full px-2 py-1">
                  2004
                </div>
                <div className="w-6 h-6 bg-[#B20000] rounded-full shadow-lg shadow-red-400"></div>
                <div className="flex flex-col items-center mt-1 space-y-4">
                  <div className="w-[25px] h-[1px] bg-black rotate-90"></div>
                  <div className="w-[25px] h-[1px] bg-black rotate-90"></div>
                </div>
              </div>
              <div className="text-black">
                <h4 className="text-lg font-semibold">Inicios profesionales</h4>
                <p className="text-sm mt-2">
                  Terminé mis estudios de tecnólogo en sistemas y comencé mi
                  vida laboral en empresas como Occel Celular, Hard Computer,
                  Clínica de Occidente, Hospital Manuel Uribe Ángel, Clínica de
                  Fracturas, Clínica de Oftalmología, entre otras. Brindaba
                  asesoría, asistencia y soporte técnico a equipos de cómputo,
                  servidores, impresoras, plotters, redes y sistemas de
                  monitoreo.
                </p>
              </div>
            </div>

            {/* Item */}
            <div className="flex flex-row w-full mt-10">
              <div className="relative w-auto mr-4">
                <div className="absolute -left-12 bg-black text-white text-xs rounded-r-full px-2 py-1">
                  2012
                </div>
                <div className="w-6 h-6 bg-[#B20000] rounded-full shadow-lg shadow-red-400"></div>
                <div className="flex flex-col items-center mt-1 space-y-4">
                  <div className="w-[25px] h-[1px] bg-black rotate-90"></div>
                  <div className="w-[25px] h-[1px] bg-black rotate-90"></div>
                </div>
              </div>
              <div className="text-black">
                <h4 className="text-lg font-semibold">Independencia laboral</h4>
                <p className="text-sm mt-2">
                  Entre 2009 y 2011 decidí independizarme y en 2012-2013 inicié
                  con compañeros de universidad un proyecto para atender
                  clientes y empresas en servicios de sistemas. La empresa nació
                  con una inversión de 50 mil pesos en publicidad y visitas a
                  empresas.
                </p>
              </div>
            </div>
          </div>

          {/* HISTORIA DE LA EMPRESA */}
          <div>
            <h2 className="text-2xl font-bold text-center text-[#B20000] mb-6">
              Historia de la Empresa
            </h2>

            {/* Item */}
            <div className="flex flex-row w-full mt-5">
              <div className="relative w-auto mr-4">
                <div className="absolute -left-20 bg-black text-white text-xs rounded-r-full px-2 py-1">
                  2015 - 2022
                </div>
                <div className="w-6 h-6 bg-[#B20000] rounded-full shadow-lg shadow-red-400"></div>
                <div className="flex flex-col items-center mt-1 space-y-4">
                  <div className="w-[25px] h-[1px] bg-black rotate-90"></div>
                  <div className="w-[25px] h-[1px] bg-black rotate-90"></div>
                </div>
              </div>
              <div className="text-black">
                <h4 className="text-lg font-semibold">Expansión empresarial</h4>
                <p className="text-sm mt-2">
                  SistemasPC prestaba servicios a más de 15 empresas reconocidas
                  en Medellín como Futuro SAS, Carwill, Ferretería Nachos,
                  Abogados de Bancolombia, Clínica Medellín, Corficolombiana,
                  Colmena, alcaldías de Sopetrán y La Ceja, entre otras. Un
                  proceso que inició con dos compañeros de universidad y fue
                  creciendo con el tiempo.
                </p>
              </div>
            </div>

            {/* Item */}
            <div className="flex flex-row w-full mt-10">
              <div className="relative w-auto mr-4">
                <div className="absolute -left-12 bg-black text-white text-xs rounded-r-full px-2 py-1">
                  2025
                </div>
                <div className="w-6 h-6 bg-[#B20000] rounded-full shadow-lg shadow-red-400"></div>
                <div className="flex flex-col items-center mt-1 space-y-4">
                  <div className="w-[25px] h-[1px] bg-black rotate-90"></div>
                  <div className="w-[25px] h-[1px] bg-black rotate-90"></div>
                </div>
              </div>
              <div className="text-black">
                <h4 className="text-lg font-semibold">Actualidad</h4>
                <p className="text-sm mt-2">
                  Hoy seguimos prestando servicios de mantenimiento y reparación
                  de equipos de cómputo e impresoras, mantenimiento de redes y
                  servidores, y sistemas de monitoreo (CCTV). Trabajamos con
                  nuevas empresas y tecnologías para optimizar procesos
                  internos.
                </p>
                <p className="text-sm mt-3">
                  <b>Medellín, Septiembre 11 del 2025</b>
                  <br />
                  <b>Contacto:</b> Pedro Pablo Córdoba G. <br />
                  Cel. 313 685 09 68 / 315 353 49 94 <br />
                  sistemaspcg@gmail.com
                </p>
              </div>
            </div>
          </div>
        </main>
      </section>
    </>
  );
};

export default Experience;
