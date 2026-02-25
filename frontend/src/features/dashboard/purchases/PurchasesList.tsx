"use client";
import React from "react";
import GraphPurchase from "./components/GraphPurchase";
import { purchasesGraphMock } from "./mock/purchasesGraph.mock";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

const PurchasesList = () => {
  const topSuppliers = purchasesGraphMock.slice(0, 5);

  const gradients: Record<number, string> = {
    1: "linear-gradient(135deg, #FF4C4C, #E63946)", // rojo intenso a rojo sangre
    2: "linear-gradient(135deg, #FF4C4C, #FF6B6B)", // rojo fuerte a coral medio
    3: "linear-gradient(135deg, #FF4C4C, #FF8A8A)", // rojo base a rosado claro
    4: "linear-gradient(135deg, #FF4C4C, #FFB3B3)", // rojo base a rosa pálido
    5: "linear-gradient(135deg, #FF4C4C, #FFD6D6)", // rojo base a rosa muy suave
  };

  return (
    <>
      <GraphPurchase />
      <h2 className="text-xl font-bold mb-6 text-center">
        Top 5 de proveedores
      </h2>

      {/* Grid responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {topSuppliers.map((supplier, index) => (
          <motion.div
            key={supplier.top}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: index * 0.3, // delay progresivo por cada card
              ease: "easeOut",
            }}
            className="cursor-pointer relative rounded-2xl shadow-lg p-5 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: gradients[supplier.top] || gradients[5],
            }}
          >
            {/* Estrellita arriba derecha */}
            <div className="absolute top-3 right-3 text-yellow-400">
              <Star size={22} fill="currentColor" />
            </div>

            {/* Contenido */}
            <div className="text-sm font-medium opacity-90">
              Top #{supplier.top}
            </div>
            <div className="text-lg font-bold">{supplier.supplier}</div>
            <div className="mt-3 text-sm opacity-90">
              <span className="font-semibold">Total:</span> {supplier.total}
            </div>
            <div className="text-sm opacity-90">
              <span className="font-semibold">Cantidad:</span>{" "}
              {supplier.quantity}
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
};

export default PurchasesList;
