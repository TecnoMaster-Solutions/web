"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

interface SearchBarProps {
  placeholder?: string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

const SearchBar = ({ placeholder = "Buscar servicios...", searchTerm, setSearchTerm }: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className="relative w-full lg:w-1/2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Search
        className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors duration-300 ${
          isFocused ? "text-red-400" : "text-gray-400"
        }`}
      />
      <motion.input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 shadow-sm
                   focus:outline-none placeholder-gray-400 transition-all duration-300"
        whileFocus={{
          backgroundColor: "#fff",
          borderColor: "rgba(178,0,0,0.6)",
          boxShadow: "0 4px 12px rgba(178,0,0,0.1)",
        }}
        transition={{ type: "spring", stiffness: 150, damping: 18 }}
      />
    </motion.div>
  );
};

export default SearchBar;
