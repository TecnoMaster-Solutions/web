import Image from "next/image";
import React, { useEffect, useState } from "react";

const HeaderSlider = () => {
  const images = [
    "/assets/imgs/HomeSlider1.webp",
    "/assets/imgs/HomeSlider2.webp",
  ];

  const [current, setCurrent] = useState(0);

  // Texto animado
  const fullText = "Bienvenido";
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

      {/* Texto encima */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
        <h2 className="text-4xl md:text-8xl font-bold text-white drop-shadow-lg animate-fadeIn">
          {displayedText}
          <span className="animate-pulse">|</span>
        </h2>
        <p className="mt-4 text-2xl md:text-5xl font-bold text-white drop-shadow-lg animate-fadeIn delay-500">
          Tu aliado tecnológico de confianza.
        </p>
      </div>

      {/* Flecha izquierda */}
      <button
        onClick={() =>
          setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1))
        }
        className="cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 text-white text-9xl font-bold hover:scale-110 transition-transform"
      >
        ‹
      </button>

      {/* Flecha derecha */}
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % images.length)}
        className="cursor-pointer absolute  right-4 top-1/2 -translate-y-1/2 text-white text-9xl font-bold hover:scale-110 transition-transform"
      >
        ›
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-4 w-full flex justify-center gap-2">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full cursor-pointer ${
              index === current ? "bg-white" : "bg-gray-500"
            }`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;
