"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const suppliers = [
  "/assets/imgs/suppliers/segurpro.png",
  "/assets/imgs/suppliers/electroExito.png",
  "/assets/imgs/suppliers/gvSolutions.png",
  "/assets/imgs/suppliers/pcmayorista.png",
  "/assets/imgs/suppliers/tecnoElectra.png",
];

const SuppliersSlider = () => {
  const itemsToShow = 4;
  const [current, setCurrent] = useState(suppliers.length); // Empezamos en el primer set real
  const [isTransitioning, setIsTransitioning] = useState(true);
  const sliderRef = useRef(null);

  const extendedSuppliers = [
    ...suppliers.slice(-itemsToShow), // Últimos elementos al inicio
    ...suppliers, // Array original
    ...suppliers.slice(0, itemsToShow), // Primeros elementos al final
  ];

  const nextSlide = () => {
    if (!isTransitioning) return;

    setCurrent((prev) => {
      const newIndex = prev + 1;
      // Si llegamos al final del set original, resetear al inicio
      if (newIndex >= suppliers.length + itemsToShow) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrent(itemsToShow);
          setTimeout(() => setIsTransitioning(true), 20);
        }, 300);
      }
      return newIndex;
    });
  };

  const prevSlide = () => {
    if (!isTransitioning) return;

    setCurrent((prev) => {
      const newIndex = prev - 1;
      // Si llegamos al inicio, ir al final del set original
      if (newIndex < itemsToShow) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrent(suppliers.length + itemsToShow - 1);
          setTimeout(() => setIsTransitioning(true), 20);
        }, 300);
      }
      return newIndex;
    });
  };

  // Autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);
    return () => clearInterval(interval);
  }, [isTransitioning]);

  return (
    <section className="py-12 relative h-80">
      {/* Título */}
      <h2
        className="text-center text-3xl md:text-5xl font-bold mb-8"
        style={{ color: "#B20000" }}
      >
        Nuestros Proveedores
      </h2>

      <div className="relative flex items-center px-12">
        {/* Flecha izquierda */}
        <button
          onClick={prevSlide}
          className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 hover:scale-110 transition-transform"
        >
          {/* Ícono más grande y responsive */}
          <ChevronLeft
            className="text-black w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
            strokeWidth={3}
          />
        </button>

        {/* Contenedor del slider */}
        <div className="overflow-hidden w-full" ref={sliderRef}>
          <div
            className={`flex ${
              isTransitioning
                ? "transition-transform duration-300 ease-in-out"
                : ""
            }`}
            style={{
              transform: `translateX(-${(current * 25) / itemsToShow}%)`,
              width: `${(extendedSuppliers.length * 100) / itemsToShow}%`,
            }}
          >
            {extendedSuppliers.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="flex-shrink-0 flex justify-center items-center p-6"
                style={{ width: `${25 / itemsToShow}%` }}
              >
                {/* Imagen más grande y responsive */}
                <div className="cursor-pointer relative w-40 h-20 sm:w-52 sm:h-28 md:w-64 md:h-32 lg:w-80 lg:h-40 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                  <Image
                    src={src}
                    alt={`Proveedor ${(index % suppliers.length) + 1}`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flecha derecha */}
        <button
          onClick={nextSlide}
          className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 hover:scale-110 transition-transform"
        >
          {/* Ícono más grande y responsive */}
          <ChevronRight
            className="text-black w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
            strokeWidth={3}
          />
        </button>
      </div>
    </section>
  );
};

export default SuppliersSlider;
