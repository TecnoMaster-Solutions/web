"use client";

import React from "react";
import { Funnel } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type FilterItem = { id: string; label: string };

interface FilterBarProps {
  className?: string;
  selectedFilters: string[];
  handleToggle: (id: string) => void;
  filters: FilterItem[];
}

const FilterBar = ({ className = "", selectedFilters, handleToggle, filters }: FilterBarProps) => {
  return (
    <aside className={`bg-white rounded-2xl shadow-lg p-4 md:p-6 flex-shrink-0 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Funnel className="text-[#B20000] w-5 h-5" />
        <h2 className="text-lg font-bold text-[#B20000]">Filtrar</h2>
      </div>

      <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Categorías</h3>

      <div className="space-y-3">
        {filters.map((filter) => {
          const isChecked = selectedFilters.includes(filter.id);

          return (
            <label
              key={filter.id}
              className="flex items-center gap-3 cursor-pointer group select-none"
              onClick={() => handleToggle(filter.id)}
            >
              <motion.span
                className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all
                  ${
                    isChecked
                      ? "border-[#B20000] bg-[#B20000] shadow-[0_0_8px_rgba(178,0,0,0.4)]"
                      : "border-gray-300 group-hover:border-[#B20000] group-hover:shadow-[0_0_6px_rgba(178,0,0,0.3)]"
                  }`}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence>
                  {isChecked && (
                    <motion.svg
                      key="check"
                      className="w-4 h-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.span>

              <motion.span
                animate={{
                  scale: isChecked ? 1.05 : 1,
                  color: isChecked ? "#B20000" : "#374151",
                }}
                whileHover={{ scale: isChecked ? 1.07 : 1.03 }}
                transition={{ duration: 0.2 }}
                className={`${isChecked ? "font-medium" : "font-normal"} ${
                  !isChecked ? "group-hover:text-[#B20000]" : ""
                }`}
              >
                {filter.label}
              </motion.span>
            </label>
          );
        })}
      </div>
    </aside>
  );
};

export default FilterBar;
