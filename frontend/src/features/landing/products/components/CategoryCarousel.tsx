"use client";

import React, { useState, useEffect, useRef, JSX } from "react";
import { motion } from "framer-motion";

import { Monitor, Camera, HardDrive, Cpu, Router } from "lucide-react";
import { getCategories } from "@/features/dashboard/categoryProducts/connection/categoryApi";

const iconMap: Record<string, JSX.Element> = {
  monitor: <Monitor className="w-6 h-6 text-[#B20000]" />,
  camera: <Camera className="w-6 h-6 text-[#B20000]" />,
  hard: <HardDrive className="w-6 h-6 text-[#B20000]" />,
  cpu: <Cpu className="w-6 h-6 text-[#B20000]" />,
  router: <Router className="w-6 h-6 text-[#B20000]" />,
};

interface Category {
  id: number;
  name: string;
  icon: string | null;
  status: boolean;
}

const cardsPerView = 3;
const buffer = cardsPerView;
const ANIMATION_MS = 400;

const CategoryCarousel: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [extended, setExtended] = useState<any[]>([]);
  const [index, setIndex] = useState(buffer);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [slideWidth, setSlideWidth] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCategories();
        if (Array.isArray(data)) {
          const active = data.filter((c) => c.status === true);

          setCategories(active);

          setExtended([
            ...active.slice(-buffer),
            ...active,
            ...active.slice(0, buffer),
          ]);

          setIndex(buffer);
        }
      } catch (err) {
        console.error("Error cargando categorías:", err);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const measure = () => {
      if (!viewportRef.current) return;
      const vw = viewportRef.current.clientWidth;
      setSlideWidth(vw / cardsPerView);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const handleNext = () => {
    if (slideWidth === 0) return;
    setIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (slideWidth === 0) return;
    setIndex((prev) => prev - 1);
  };

  useEffect(() => {
    if (extended.length === 0) return;

    const realStart = buffer;
    const realEnd = categories.length + buffer - 1;

    if (index > realEnd) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setIndex(realStart);
        setTimeout(() => setIsTransitioning(true), 20);
      }, ANIMATION_MS);
      return () => clearTimeout(t);
    }

    if (index < realStart) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setIndex(realEnd);
        setTimeout(() => setIsTransitioning(true), 20);
      }, ANIMATION_MS);
      return () => clearTimeout(t);
    }
  }, [index, extended]);

  const translateX = -index * slideWidth;

return (
  <section className="relative w-full">
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold text-[#B20000] mb-10 tracking-tight">
          Categorías de Productos
        </h2>
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="relative px-16 pb-8">
          <div ref={viewportRef} className="overflow-hidden">
            <motion.div
              className="flex items-stretch"
              animate={{ x: translateX }}
              transition={
                isTransitioning
                  ? { duration: ANIMATION_MS / 1000, ease: "easeInOut" }
                  : { duration: 0 }
              }
              style={{ width: `${extended.length * slideWidth}px` }}
            >
              {extended.map((cat, idx) => (
                <div
                  key={`${cat.id}-${idx}`}
                  className="flex-shrink-0"
                  style={{ width: `${slideWidth}px` }}
                >
                  <div className="px-3 py-2 h-full">
                    <div
                      className={[
                        "bg-white rounded-2xl",
                        "border border-gray-100",
                        "shadow-[0_6px_18px_rgba(0,0,0,0.06)]",
                        "transition-all duration-300 ease-out",
                        "hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(0,0,0,0.10)]",
                        "hover:border-[#B20000]/30",
                        "p-6 flex flex-col items-center text-center gap-5",
                        "min-h-[180px]",
                        "group",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "bg-white rounded-full",
                          "border-2 border-[#B20000]",
                          "w-16 h-16 p-4",
                          "flex items-center justify-center",
                          "shadow-sm",
                          "ring-1 ring-[#B20000]/10",
                          "transition-transform duration-300",
                          "group-hover:scale-[1.03]",
                        ].join(" ")}
                      >
                        {cat.icon && cat.icon.startsWith("http") ? (
                          <img
                            src={cat.icon}
                            alt={cat.name}
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          iconMap[cat.icon || "monitor"] || iconMap["monitor"]
                        )}
                      </div>

                      <h3 className="text-lg md:text-xl font-semibold text-gray-800 leading-tight">
                        {cat.name}
                      </h3>

                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <button
            onClick={handlePrev}
            className={[
              "absolute left-4 top-1/2 -translate-y-1/2 z-20",
              "w-11 h-11 flex items-center justify-center",
              "bg-white rounded-full",
              "shadow-md border border-gray-100",
              "transition-all duration-200",
              "hover:shadow-lg hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-[#B20000]/30 focus:ring-offset-2",
            ].join(" ")}
            aria-label="Anterior"
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className={[
              "absolute right-4 top-1/2 -translate-y-1/2 z-20",
              "w-11 h-11 flex items-center justify-center",
              "bg-white rounded-full",
              "shadow-md border border-gray-100",
              "transition-all duration-200",
              "hover:shadow-lg hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-[#B20000]/30 focus:ring-offset-2",
            ].join(" ")}
            aria-label="Siguiente"
          >
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
);
};

export default CategoryCarousel;
