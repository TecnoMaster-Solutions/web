"use client";

import React from "react";

interface BackgroundWavesProps {
  className?: string;
  baseColor?: string; // Color principal para el degradado
}

const BackgroundWaves = ({ className = "", baseColor = "#374151" }: BackgroundWavesProps) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Capa de ondas inferior con degradado más oscuro */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[600px] sm:h-[700px] md:h-[800px]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={baseColor} stopOpacity="0.7" />
            <stop offset="100%" stopColor="#4b5563" stopOpacity="0.5" /> {/* Un gris más oscuro */}
          </linearGradient>
        </defs>
        <path
          fill="url(#waveGradientDark)"
          d="M0,160L60,181.3C120,203,240,245,360,250.7C480,256,600,224,720,202.7C840,181,960,171,1080,186.7C1200,203,1320,245,1380,266.7L1440,288L1440,320L0,320Z"
        />
      </svg>

      {/* Capa de ondas intermedia con degradado más claro y translúcido */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[650px] sm:h-[750px] md:h-[850px] opacity-90"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradientLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={baseColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6b7280" stopOpacity="0.3" /> {/* Un gris medio */}
          </linearGradient>
        </defs>
        <path
          fill="url(#waveGradientLight)"
          d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,229.3C840,245,960,235,1080,218.7C1200,203,1320,181,1380,170.7L1440,160L1440,320L0,320Z"
        />
      </svg>

      {/* Nueva capa de ondas superior (más clara y difuminada) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[700px] sm:h-[800px] md:h-[900px] opacity-70"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradientTop" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.4" /> {/* Gris muy claro */}
            <stop offset="100%" stopColor="#f3f4f6" stopOpacity="0.2" /> {/* Blanco grisáceo */}
          </linearGradient>
        </defs>
        <path
          fill="url(#waveGradientTop)"
          d="M0,256L60,234.7C120,213,240,171,360,160C480,149,600,171,720,192C840,213,960,235,1080,218.7C1200,203,1320,149,1380,128L1440,107L1440,320L0,320Z"
        />
      </svg>
    </div>
  );
};

export default BackgroundWaves;