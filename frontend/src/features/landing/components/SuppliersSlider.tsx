"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSuppliers, SupplierDTO } from "@/features/dashboard/suppliers/services/suppliers.service";

const SuppliersSlider = () => {
  const itemsToShow = 4;
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliers();
        const validSuppliers = data.filter((s) => s.image);
        setSuppliers(validSuppliers);
        setCurrent(validSuppliers.length);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };
    fetchSuppliers();
  }, []);

  const extendedSuppliers = suppliers.length > 0 ? [
    ...suppliers.slice(-itemsToShow),
    ...suppliers,
    ...suppliers.slice(0, itemsToShow),
  ] : [];

  const nextSlide = useCallback(() => {
    if (!isTransitioning || suppliers.length === 0) return;

    setCurrent((prev) => {
      const newIndex = prev + 1;
      if (newIndex >= suppliers.length + itemsToShow) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrent(itemsToShow);
          setTimeout(() => setIsTransitioning(true), 20);
        }, 300);
      }
      return newIndex;
    });
  }, [isTransitioning, itemsToShow, suppliers.length]);

  const prevSlide = () => {
    if (!isTransitioning || suppliers.length === 0) return;

    setCurrent((prev) => {
      const newIndex = prev - 1;
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

  useEffect(() => {
    if (suppliers.length === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);
    return () => clearInterval(interval);
  }, [nextSlide, suppliers.length]);

  if (suppliers.length === 0) {
    return null; // Don't render if no suppliers to avoid breaking layout
  }

  return (
    <section className="py-16 relative bg-gray-50/50">
      {/* Título */}
      <div className="flex justify-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-800 border-l-8 border-[#04652c] pl-4 uppercase tracking-wide">
          Nuestros Proveedores
        </h2>
      </div>

      <div className="relative flex items-center max-w-7xl mx-auto px-4 sm:px-12">
        {/* Flecha izquierda */}
        <button
          onClick={prevSlide}
          className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 text-[#04652c] hover:text-[#06a646] hover:scale-110 transition-transform bg-white rounded-full shadow-md ml-2"
        >
          <ChevronLeft
            className="w-8 h-8 md:w-10 md:h-10"
            strokeWidth={2.5}
          />
        </button>

        {/* Contenedor del slider */}
        <div className="overflow-hidden w-full px-4 py-6" ref={sliderRef}>
          <div
            className={`flex items-center ${isTransitioning
              ? "transition-transform duration-500 ease-in-out"
              : ""
              }`}
            style={{
              transform: `translateX(-${(current * 100) / itemsToShow}%)`,
              width: `${(extendedSuppliers.length * 100) / itemsToShow}%`,
            }}
          >
            {extendedSuppliers.map((supplier: SupplierDTO, index: number) => (
              <div
                key={`${supplier.nit || index}-${index}`}
                className="flex-shrink-0 flex justify-center items-center px-4"
                style={{ width: `${100 / itemsToShow}%` }}
              >
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 hover:scale-105 w-full h-48 sm:h-56">
                  <div className="relative w-full h-24 sm:h-32 mb-4 group">
                    <Image
                      src={supplier.image || ""}
                      alt={supplier.name || "Proveedor"}
                      fill
                      className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-gray-700 text-center truncate w-full">
                    {supplier.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flecha derecha */}
        <button
          onClick={nextSlide}
          className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 text-[#04652c] hover:text-[#06a646] hover:scale-110 transition-transform bg-white rounded-full shadow-md mr-2"
        >
          <ChevronRight
            className="w-8 h-8 md:w-10 md:h-10"
            strokeWidth={2.5}
          />
        </button>
      </div>
    </section>
  );
};

export default SuppliersSlider;
