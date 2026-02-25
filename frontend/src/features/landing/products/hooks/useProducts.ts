"use client";

import { useEffect, useMemo, useState } from "react";
import { getLandingProducts } from "../api/products.api";

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

export const useProducts = (fallbackProducts: Product[] = []) => {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);

  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const list = await getLandingProducts();
        if (!alive) return;
        setProducts(list);
      } catch (e) {
        if (!alive) return;
        console.error("Landing products: error cargando del backend:", e);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const handleToggleFilter = (id: string) => {
    if (id === "all") {
      setSelectedFilters(["all"]);
    } else {
      let updated: string[];
      if (selectedFilters.includes(id)) {
        updated = selectedFilters.filter((f) => f !== id);
      } else {
        updated = [...selectedFilters.filter((f) => f !== "all"), id];
      }
      setSelectedFilters(updated.length > 0 ? updated : ["all"]);
    }
  };

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    return products.filter((product) => {
      const normalizedCategory = normalizeText(product.category);
      const normalizedTitle = normalizeText(product.title);
      const normalizedDescription = normalizeText(product.description);

      const categoryMatch =
        selectedFilters.includes("all") ||
        selectedFilters.some((f) => normalizeText(f) === normalizedCategory);

      const searchMatch =
        normalizedTitle.includes(normalizedSearch) ||
        normalizedDescription.includes(normalizedSearch) ||
        normalizedCategory.includes(normalizedSearch);

      

      return categoryMatch && searchMatch;
    });
  }, [products, selectedFilters, searchTerm]);

  const availableCategories = useMemo(() => {
    const uniqueCategories = new Set<string>();

    products.forEach((product) => {
      const category = product.category?.trim();
      if (category) {
        uniqueCategories.add(category);
      }
    });

    return Array.from(uniqueCategories).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [products]);

  return {
    loading,
    selectedFilters,
    handleToggleFilter,
    searchTerm,
    setSearchTerm,
    filteredProducts,
    availableCategories,
  };
};
