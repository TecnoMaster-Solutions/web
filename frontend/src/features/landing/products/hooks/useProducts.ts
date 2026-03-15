"use client";

import { useState } from "react";

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  images?: string[];
  price?: number;
  stock: number;
}

export const useProducts = () => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleToggleFilter = (id: string) => {
    if (id === "all") {
      setSelectedFilters(["all"]);
      return;
    }

    if (selectedFilters.includes(id)) {
      setSelectedFilters(["all"]);
      return;
    }

    setSelectedFilters([id]);
  };

  return {
    selectedFilters,
    handleToggleFilter,
    searchTerm,
    setSearchTerm,
  };
};
