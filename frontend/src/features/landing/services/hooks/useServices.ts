import { useState } from "react";

export interface Service {
  id?: number;
  title: string;
  description: string;
  category: string;
  image?: string;
}

export const useServices = () => {
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
