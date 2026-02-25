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
    <div className="relative w-full h-[450px] md:h-[500px] lg:h-[550px] font-montserrat">
      <img
        src="/assets/imgs/products/bannerproducts.jpg"
        alt="Banner de Productos"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-b from-transparent via-gray-100/30 to-gray-100" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 md:px-16 text-center text-white">
        <p className="text-lg md:text-xl lg:text-2xl font-extrabold mb-3 text-[#B22222] uppercase tracking-wide drop-shadow-md">
          Encuentra el producto perfecto
        </p>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-4 text-white drop-shadow-xl">
          {displayedText.split(" ").map((word, idx) =>
            word.toLowerCase() === "productos" ? (
              <span key={idx} className="text-[#B22222]">
                {word}{" "}
              </span>
            ) : (
              <span key={idx}>{word} </span>
            )
          )}
          <span className="animate-pulse text-[#B22222]">|</span>
        </h1>

        <p className="text-md md:text-lg lg:text-xl font-bold mb-6 max-w-xl text-white drop-shadow-md">
          Descubre nuestra selección de productos diseñados para elevar tu
          experiencia tecnológica.
        </p>
      </div>
    </div>
  );
};

export default Banner;
