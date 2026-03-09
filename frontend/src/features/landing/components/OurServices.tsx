import React from "react";
import { Wrench, Settings, PenTool } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/routes";

const OurServices = () => {
  const services = [
    {
      title: "Mantenimiento Correctivo",
      description:
        "Atendemos y reparamos fallas o averías imprevistas en tus equipos o sistemas, asegurando que vuelvan a operar de forma eficiente y segura en el menor tiempo posible.",
      icon: <Wrench className="w-10 h-10 text-[#04652c]" />,
    },
    {
      title: "Mantenimiento Preventivo",
      description:
        "Realizamos inspecciones y ajustes periódicos para prevenir fallos, mejorar el rendimiento y extender la vida útil de tus equipos, evitando interrupciones innecesarias.",
      icon: <Settings className="w-10 h-10 text-[#04652c]" />,
    },
    {
      title: "Instalación",
      description:
        "Nos encargamos de la instalación de equipos, sistemas eléctricos o electrónicos, garantizando que funcionen correctamente desde el primer uso y cumplan con todos los estándares.",
      icon: <PenTool className="w-10 h-10 text-[#04652c]" />,
    },
  ];

  return (
    <section className="bg-gray-50 py-20 px-6 sm:px-10 lg:px-20">
      {/* Título */}
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#04652c] tracking-wide uppercase">
          Categoría de Servicios
        </h2>
        {/* Línea decorativa verde */}
        <div className="w-24 h-1.5 bg-[#04652c] mx-auto mt-4 rounded-full"></div>
      </div>

      {/* Grid de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
        {services.map((service, index) => (
          <div
            key={index}
            className="group flex flex-col items-center text-center p-10 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#04652c]/20 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
          >
            {/* Ícono */}
            <div className="w-20 h-20 bg-[#e6eeea] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#04652c] transition-all duration-300">
              {/* Cambiar color del ícono en hover */}
              <div className="group-hover:text-white transition-colors duration-300 *:text-current">
                {service.icon}
              </div>
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-[#06a646] transition-colors">
              {service.title}
            </h3>

            {/* Descripción */}
            <p className="text-gray-600 leading-relaxed flex-grow">
              {service.description}
            </p>

            {/* Link */}
            <Link
              href={routes.landing.services}
              className="mt-8 font-semibold text-[#04652c] group-hover:text-[#06a646] flex items-center gap-2 hover:gap-3 transition-all"
            >
              Explorar <span className="text-xl leading-none">→</span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OurServices;
