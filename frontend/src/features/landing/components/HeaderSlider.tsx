import Image from "next/image";
import React, { useEffect, useState } from "react";

const HeaderSlider = () => {
  const images = [
    "/assets/imgs/HomeSlider1.webp",
    "/assets/imgs/HomeSlider2.webp",
  ];

  const [current, setCurrent] = useState(0);

  // Texto animado
  const fullText = "Bienvenido a TecnoMaster";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) {
        clearInterval(interval);
      }
    }, 100); // velocidad de escritura (100ms por letra)

    return () => clearInterval(interval);
  }, []);

  // Cambiar imagen cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[900px] overflow-hidden">
      {/* Imagen */}
      <Image
        src={images[current]}
        alt="Home slider"
        fill
        priority
        className="object-cover transition-all duration-700"
      />

      <div className="absolute inset-0 bg-[#04652c]/80 z-10" />

      {/* Texto encima */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center px-4">
        <h2 className="text-4xl md:text-7xl font-bold text-white drop-shadow-lg animate-fadeIn">
          {displayedText}
          <span className="animate-pulse">|</span>
        </h2>
        <p className="mt-6 text-xl md:text-3xl font-medium text-gray-200 drop-shadow-md animate-fadeIn delay-500 max-w-3xl">
          Soluciones tecnológicas avanzadas para su empresa
        </p>
        <button
          className="mt-10 px-8 py-3 rounded-md text-lg font-semibold text-white bg-[#04652c] hover:bg-[#06a646] transition-all duration-300 shadow-lg hover:scale-105"
        >
          Ver Más
        </button>
      </div>

      {/* Flecha izquierda */}
      <button
        onClick={() =>
          setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1))
        }
        className="cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 z-30 text-white/70 hover:text-white text-6xl md:text-8xl font-bold hover:scale-110 transition-all duration-300"
      >
        ‹
      </button>

      {/* Flecha derecha */}
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % images.length)}
        className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 z-30 text-white/70 hover:text-white text-6xl md:text-8xl font-bold hover:scale-110 transition-all duration-300"
      >
        ›
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-6 w-full z-30 flex justify-center gap-3">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full cursor-pointer ${index === current ? "bg-white" : "bg-gray-500"
              }`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;
