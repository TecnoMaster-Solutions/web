import { useState, useEffect, useRef, useCallback } from "react";
import { Category } from "../types/typeCategoryProducts";

export const useViewCategory = (category: Category | null) => {
  const [currentIcon, setCurrentIcon] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    if (!category) {
      setCurrentIcon(null);
      return;
    }

    if (typeof category.icon === "string") {
      setCurrentIcon(category.icon);
      return;
    }

    if (category.icon instanceof File) {
      const url = URL.createObjectURL(category.icon);
      previewRef.current = url;
      setCurrentIcon(url);
      return;
    }

    setCurrentIcon(null);
  }, [category]);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
    };
  }, []);

  const resetIcon = useCallback(() => {
    setCurrentIcon(null);
  }, []);

  return { currentIcon, resetIcon };
};
