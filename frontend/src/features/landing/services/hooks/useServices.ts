import { useState, useMemo } from "react";

export interface Service {
  id?: number;
  title: string;
  description: string;
  category: string;
  image?: string;
}

export const useServices = (services: Service[]) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleToggleFilter = (id: string) => {
    if (id === "all") {
      setSelectedFilters(["all"]);
    } else {
      let updated;
      if (selectedFilters.includes(id)) {
        updated = selectedFilters.filter((f) => f !== id);
      } else {
        updated = [...selectedFilters.filter((f) => f !== "all"), id];
      }
      setSelectedFilters(updated.length > 0 ? updated : ["all"]);
    }
  };

  const normalizeText = (text: string) =>
    (text ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredServices = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    return services.filter((service) => {
      const normalizedCategory = normalizeText(service.category);
      const normalizedTitle = normalizeText(service.title);
      const normalizedDescription = normalizeText(service.description);

      const categoryMatch =
        selectedFilters.includes("all") ||
        selectedFilters.some((f) => normalizeText(f) === normalizedCategory);

      const searchMatch =
        normalizedTitle.includes(normalizedSearch) ||
        normalizedDescription.includes(normalizedSearch) ||
        normalizedCategory.includes(normalizedSearch);

      return categoryMatch && searchMatch;
    });
  }, [services, selectedFilters, searchTerm]);

  return {
    selectedFilters,
    handleToggleFilter,
    searchTerm,
    setSearchTerm,
    filteredServices,
  };
};
