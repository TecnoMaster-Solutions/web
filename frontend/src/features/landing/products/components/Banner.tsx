import React, { useEffect, useState } from "react";

const Banner = () => {
  const fullText = "Nuestros Productos";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[450px] md:h-[500px] lg:h-[550px] font-montserrat overflow-hidden">
      <img
        src="/assets/imgs/products/bannerproducts.jpg"
        alt="Banner de Productos"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/40" />
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-b from-transparent via-gray-100/20 to-gray-100" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 md:px-16 text-center text-white">
        <div className="max-w-4xl">
          <p className="inline-block text-sm md:text-base lg:text-lg font-extrabold mb-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[#d8f3df] uppercase tracking-[0.2em] shadow-lg">
            Encuentra el producto perfecto
          </p>

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-5 text-white"
            style={{
              textShadow:
                "0 4px 18px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.45)",
            }}
          >
            {displayedText.split(" ").map((word, idx) =>
              word.toLowerCase() === "productos" ? (
                <span
                  key={idx}
                  className="text-[#7ee0a1] drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]"
                >
                  {word}{" "}
                </span>
              ) : (
                <span key={idx}>{word} </span>
              )
            )}
            <span className="animate-pulse text-[#7ee0a1] drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]">
              |
            </span>
          </h1>

          <p
            className="text-md md:text-lg lg:text-xl font-semibold mb-6 max-w-2xl mx-auto text-white/95"
            style={{
              textShadow: "0 2px 10px rgba(0,0,0,0.45)",
            }}
          >
            Descubre nuestra selección de productos diseñados para elevar tu
            experiencia tecnológica.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Banner;