"use client";

import React from "react";
import BackgroundWaves from "@/features/landing/components/BackgroundWaves";

interface LayoutServiciosProps {
  children: React.ReactNode;
}

const LayoutServicios = ({ children }: LayoutServiciosProps) => {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-gray-100 to-white">
      <BackgroundWaves baseColor="#374151" />
      
      {/* Contenedor principal para el contenido, que ahora no tiene flex */}
      <div className="relative z-10 container mx-auto flex flex-col gap-8 px-6 py-10">
        {/* Aquí es donde se renderizarán los componentes hijos de ServicesLanding */}
        {children}
      </div>
    </div>
  );
};

export default LayoutServicios;