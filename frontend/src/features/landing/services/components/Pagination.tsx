"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center mt-8 gap-2">
      {/* Botón anterior */}
      <motion.button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        className={`p-2 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all
          ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:border-[#B20000] hover:text-[#B20000]"}`}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      {/* Números */}
      {pages.map((page) => (
        <motion.button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-full border text-sm font-medium transition-all 
            ${
              currentPage === page
                ? "bg-[#B20000] text-white shadow-md"
                : "bg-white border-gray-200 text-gray-700 hover:border-[#B20000] hover:text-[#B20000] hover:shadow"
            }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {page}
        </motion.button>
      ))}

      {/* Botón siguiente */}
      <motion.button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        className={`p-2 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all
          ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-[#B20000] hover:text-[#B20000]"
          }`}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default Pagination;
