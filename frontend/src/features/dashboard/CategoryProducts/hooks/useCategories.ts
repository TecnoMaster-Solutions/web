"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { confirmDelete } from "@/shared/utils/Delete/confirmDelete";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { getProducts } from "@/features/dashboard/products/api/products.api";
import {
  getCategories,
  getActiveCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../connection/categoryApi";
import {
  Category,
  CategoryApiShape,
  CategoriesPaginatedResult,
  CreateCategoryData,
  EditCategoryData,
} from "../types/typeCategoryProducts";

type UseCategoriesOptions = {
  onlyActive?: boolean;
  includeCurrentCategory?: {
    id: number;
    name: string;
  } | null;
};

const waitForNextRender = async () => {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        resolve();
      })
    );
  });
};

const resolvePayloadData = (value: unknown): unknown => {
  if (!value || typeof value !== "object") return value;
  if ("data" in value) return resolvePayloadData((value as { data?: unknown }).data);
  return value;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === null) return false;
  if (typeof value === "number") return Boolean(value);
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "1") return true;
    if (lower === "false" || lower === "0") return false;
  }
  return Boolean(value);
};

const parseCategoryPayload = (payload: unknown): Category | null => {
  if (!payload || typeof payload !== "object") return null;

  const resolved = resolvePayloadData(payload);
  if (!resolved || typeof resolved !== "object") return null;
  const category = resolved as CategoryApiShape;

  const idValue = category.id ?? category.categoryid ?? category.category_id;
  const numericId = typeof idValue === "number" ? idValue : Number(idValue);
  const id =
    typeof idValue === "number" ? idValue : Number.isFinite(numericId) ? numericId : null;

  if (id === null || id <= 0) return null;

  return {
    id,
    name: String(category.name ?? category.categoryname ?? ""),
    description: String(category.description ?? category.categorydescription ?? ""),
    status: toBoolean(category.status ?? category.isactive),
    icon: category.icon ?? null,
  };
};

const extractPayloadCategory = (response: unknown): Category | null => {
  return parseCategoryPayload(response);
};

export const useCategories = (options?: UseCategoriesOptions) => {
  const PAGE_SIZE = 5;
  const SEARCH_DEBOUNCE_MS = 350;

  const onlyActive = options?.onlyActive ?? false;
  const includeCurrentCategory = options?.includeCurrentCategory ?? null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [pagedCategories, setPagedCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EditCategoryData | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<number, number>>({});

  const hasFetchedRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const refreshCategoryProductCounts = useCallback(async () => {
    try {
      const response = await getProducts({
        status: "all",
        page: 1,
        limit: 1000,
        search: "",
      });

      const counts: Record<number, number> = {};

      response.data.forEach((product) => {
        const categoryId = product.categoryId;
        if (!categoryId) return;
        counts[categoryId] = (counts[categoryId] ?? 0) + 1;
      });

      setCategoryProductCounts(counts);
    } catch (error) {
      console.error("Error al cargar productos para verificar las categorias:", error);
      setCategoryProductCounts({});
    }
  }, []);

  const refreshAllCategories = useCallback(async () => {
    let list = onlyActive
      ? ((await getActiveCategories()) as Category[])
      : ((await getCategories()) as Category[]);

    if (
      includeCurrentCategory &&
      Number(includeCurrentCategory.id) > 0 &&
      String(includeCurrentCategory.name ?? "").trim() &&
      !list.some((item) => Number(item.id) === Number(includeCurrentCategory.id))
    ) {
      list = [
        ...list,
        {
          id: Number(includeCurrentCategory.id),
          name: `${String(includeCurrentCategory.name).trim()} (Inactiva)`,
          description: "",
          status: false,
          icon: null,
        },
      ];
    }

    setCategories(list);
    return list;
  }, [onlyActive, includeCurrentCategory]);

  const refreshCategories = useCallback(
    async (
      targetPage: number = currentPage,
      searchText: string = search,
      signal?: AbortSignal
    ) => {
      const response = (await getCategories({
        page: targetPage,
        limit: PAGE_SIZE,
        search: searchText,
        signal,
      })) as CategoriesPaginatedResult;

      const list = Array.isArray(response?.data) ? response.data : [];
      const meta = response?.meta;

      setPagedCategories(list);
      setCurrentPage(Number(meta?.page ?? targetPage));
      setTotalPages(Math.max(1, Number(meta?.totalPages ?? 1)));
      return { list, meta };
    },
    [currentPage, search]
  );

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          refreshCategories(1, ""),
          refreshAllCategories(),
          refreshCategoryProductCounts(),
        ]);
      } catch (error) {
        console.error("Error al cargar categorias:", error);
        showError("No se pudieron cargar las categorias.");
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      load();
    }
  }, [refreshAllCategories, refreshCategories, refreshCategoryProductCounts]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      searchAbortRef.current?.abort();
    };
  }, []);

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      try {
        await refreshCategories(nextPage, search);
      } catch (error) {
        console.error("Error al cambiar de pagina:", error);
        showError("No se pudo cargar la pagina de categorias.");
      } finally {
        setLoading(false);
      }
    },
    [refreshCategories, search]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchAbortRef.current?.abort();

      const controller = new AbortController();
      searchAbortRef.current = controller;

      searchDebounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          await refreshCategories(1, value, controller.signal);
        } catch (error: unknown) {
          if (
            (error instanceof Error && error.name === "CanceledError") ||
            (typeof error === "object" &&
              error !== null &&
              "code" in error &&
              (error as { code?: string }).code === "ERR_CANCELED") ||
            controller.signal.aborted
          ) {
            return;
          }
          console.error("Error al buscar categorias:", error);
          showError("No se pudo buscar categorias.");
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }, SEARCH_DEBOUNCE_MS);
    },
    [refreshCategories]
  );

  const handleCreateCategory = useCallback(
    async (categoryData: CreateCategoryData) => {
      setLoading(true);
      try {
        setIsCreateModalOpen(false);
        await createCategory(categoryData);
        await Promise.all([
          refreshCategories(1, search),
          refreshAllCategories(),
          refreshCategoryProductCounts(),
        ]);
        showSuccess("Categoria creada exitosamente!");
      } catch (error) {
        console.error("Error al crear categoria:", error);
        showError("No se pudo crear la categoria.");
      } finally {
        setLoading(false);
      }
    },
    [refreshAllCategories, refreshCategories, refreshCategoryProductCounts, search]
  );

  const handleEditCategory = useCallback(
    async (id: number, categoryData: EditCategoryData) => {
      setLoading(true);
      try {
        const response = await updateCategory(id, categoryData);
        const updatedCategory = extractPayloadCategory(response);

        if (updatedCategory) {
          setPagedCategories((prev) =>
            prev.map((item) => (item.id === updatedCategory.id ? updatedCategory : item))
          );
          setCategories((prev) =>
            prev.map((item) => (item.id === updatedCategory.id ? updatedCategory : item))
          );
        } else {
          await Promise.all([
            refreshCategories(currentPage, search),
            refreshAllCategories(),
          ]);
        }

        showSuccess("Categoria actualizada exitosamente!");
      } catch (error) {
        console.error("Error al actualizar categoria:", error);
        showError("No se pudo actualizar la categoria.");
      } finally {
        setLoading(false);
        setEditingCategory(null);
      }
    },
    [currentPage, refreshAllCategories, refreshCategories, search]
  );

  const handleDeleteCategory = useCallback(
    async (category: Category): Promise<boolean> => {
      return confirmDelete(
        {
          itemName: category.name,
          itemType: "categoria",
          successMessage: `La categoria "${category.name}" ha sido eliminada correctamente.`,
          errorMessage: "No se pudo eliminar la categoria.",
        },
        async () => {
          setLoading(true);
          try {
            await deleteCategory(category.id);
            const activeSearch = search.trim();

            if (activeSearch) {
              setSearch("");
              await refreshCategories(1, "");
            } else {
              const { list } = await refreshCategories(currentPage, search);
              if (list.length === 0 && currentPage > 1) {
                await refreshCategories(currentPage - 1, search);
              }
            }

            await Promise.all([refreshAllCategories(), refreshCategoryProductCounts()]);
            await waitForNextRender();
          } catch (error) {
            console.error("Error al eliminar categoria:", error);
            const parsedError = error instanceof Error ? error.message : undefined;
            showError(parsedError ?? "Error al eliminar la categoria.");
            throw error;
          } finally {
            setLoading(false);
          }
        }
      );
    },
    [currentPage, refreshAllCategories, refreshCategories, refreshCategoryProductCounts, search]
  );

  const handleView = useCallback((category: Category) => {
    setViewingCategory(category);
  }, []);

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      description: category.description,
      status: category.status,
      icon: category.icon,
    });
  }, []);

  const closeModals = useCallback(() => {
    setEditingCategory(null);
    setViewingCategory(null);
    setIsCreateModalOpen(false);
  }, []);

  return {
    categories,
    pagedCategories,
    categoryProductCounts,
    initialLoading,
    loading,
    currentPage,
    totalPages,
    pageSize: PAGE_SIZE,
    search,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingCategory,
    viewingCategory,
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
    handlePageChange,
    handleSearchChange,
    handleView,
    handleEdit,
    closeModals,
  };
};
