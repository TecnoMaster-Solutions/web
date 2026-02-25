"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface CardProductProps {
  id: string;
  title: string;
  description: string;
  category?: string;
  image?: string;
  price?: number;
  stock?: number;
  onAddToCart?: () => void;
}

export default function CardProduct({
  id,
  title,
  description,
  category,
  image,
  price,
  stock = 0,
  onAddToCart,
}: CardProductProps) {
  const router = useRouter();

  const inStock = stock > 0;

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer font-montserrat flex flex-col h-full"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{
        y: -5,
        boxShadow: "0 12px 20px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className="aspect-[4/3] bg-white flex items-center justify-center bg-center bg-contain bg-no-repeat"
        style={{ backgroundImage: image ? `url(${image})` : "none" }}
      >
        {!image && <span className="text-gray-400 text-sm">Sin imagen</span>}
      </div>

      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>

          {category && (
            <span className="text-sm font-semibold text-[#B20000]">
              {category}
            </span>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                inStock
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {inStock ? "Disponible" : "Agotado"}
            </span>

            {inStock && (
              <span className="text-xs text-gray-600">
                <strong>Unidades:</strong> {stock}
              </span>
            )}
          </div>

          <p className="text-gray-600 text-sm mt-2 overflow-hidden line-clamp-2">
            {description}
          </p>

          {price !== undefined && (
            <span className="block text-lg font-bold text-[#B20000] mt-2">
              ${price.toLocaleString("es-CO")}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <motion.button
            onClick={onAddToCart}
            disabled={!inStock}
            className={`rounded-full px-4 py-1.5 w-1/2 text-sm flex items-center justify-center gap-2 transition ${
              inStock
                ? "bg-[#B20000] text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            whileHover={
              inStock
                ? {
                    scale: 1.05,
                    boxShadow: "0 4px 12px rgba(178,0,0,0.3)",
                  }
                : {}
            }
            whileTap={inStock ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
          >
            <FaShoppingCart />
            {inStock ? "Agregar" : "Sin stock"}
          </motion.button>

          <motion.button
            className="border border-[#B20000] text-[#B20000] rounded-full px-4 py-1.5 w-1/2 text-sm"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 4px 12px rgba(178,0,0,0.1)",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
            onClick={() => router.push(`/landing/products/${id}`)}
          >
            Ver Detalles
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}