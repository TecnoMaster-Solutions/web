import React from "react";
import Image from "next/image";
import Colors from "@/shared/theme/colors";

const OurServices = () => {
  const services = [
    {
      title: "MANTENIMIENTO CORRECTIVO",
      description:
        "Atendemos y reparamos fallas o averías imprevistas en tus equipos o sistemas, asegurando que vuelvan a operar de forma eficiente y segura en el menor tiempo posible.",
      image: "/assets/imgs/services/corrective.png",
    },
    {
      title: "MANTENIMIENTO PREVENTIVO",
      description:
        "Realizamos inspecciones y ajustes periódicos para prevenir fallos, mejorar el rendimiento y extender la vida útil de tus equipos, evitando interrupciones innecesarias.",
      image: "/assets/imgs/services/preventive.png",
    },
    {
      title: "INSTALACIÓN",
      description:
        "Nos encargamos de la instalación de equipos, sistemas eléctricos o electrónicos, garantizando que funcionen correctamente desde el primer uso y cumplan con todos los estándares.",
      image: "/assets/imgs/services/installation.png",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-white to-gray-900 py-16 px-6 sm:px-10 lg:px-20 text-center">
      {/* Título */}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-red-700 mb-12">
        Categoría de Servicios
      </h2>

      {/* Grid de servicios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 mb-16">
        {services.map((service, index) => (
          <div
            key={index}
            className="cursor-pointer flex flex-col items-center text-white text-center p-8 rounded-2xl 
            bg-gray-800/40 shadow-md hover:shadow-2xl hover:scale-105 transition-transform duration-300"
          >
            {/* Imagen */}
            <div className="w-50 h-46 flex items-center justify-center mb-6">
              <Image
                src={service.image}
                alt={service.title}
                width={250}
                height={150}
                className="object-contain transform transition-transform duration-500 hover:rotate-3 hover:scale-105"
              />
            </div>

            {/* Título */}
            <h3 className="text-lg sm:text-xl font-bold mb-4">
              {service.title}
            </h3>

            {/* Descripción */}
            <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
              {service.description}
            </p>
          </div>
        ))}
      </div>

      {/* Botón */}
      <button
        style={{ backgroundColor: Colors.buttons.primary }}
        className="relative cursor-pointer inline-flex items-center justify-center px-8 py-3 text-base sm:text-lg font-semibold text-white rounded-md shadow-lg overflow-hidden group transition-transform duration-300 hover:scale-105"
      >
        <span className="absolute inset-0 bg-red-800 scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
        <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
          Ver más
        </span>
      </button>
    </section>
  );
};

export default OurServices;
