"use client";

import React from "react";
import BackgroundWaves from "@/features/landing/components/BackgroundWaves";

interface LayoutProductosProps {
  children: React.ReactNode;
}

const LayoutProductos = ({ children }: LayoutProductosProps) => {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-gray-100 to-white">
      <BackgroundWaves baseColor="#374151" />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8 px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </div>
    </div>
  );
};

export default LayoutProductos;
