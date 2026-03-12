import { useCallback, useEffect, useRef, useState } from "react";
import { confirmDelete } from "@/shared/utils/Delete/confirmDelete";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { getProducts } from "@/features/dashboard/products/api/products.api";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../connection/categoryApi";
import {
  Category,
  CategoriesPaginatedResult,
  CreateCategoryData,
  EditCategoryData,
} from "../types/typeCategoryProducts";

const waitForNextRender = async () => {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        resolve();
      }),
    );
  });
};

const resolvePayloadData = (value: unknown): any => {
  if (!value || typeof value !== "object") return value;
  if ("data" in value) return resolvePayloadData((value as any).data);
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

const parseCategoryPayload = (payload: any): Category | null => {
  if (!payload || typeof payload !== "object") return null;

  const resolved = resolvePayloadData(payload);
  if (!resolved || typeof resolved !== "object") return null;

  const idValue = resolved.id ?? resolved.categoryid ?? resolved.category_id;
  const numericId = typeof idValue === "number" ? idValue : Number(idValue);
  const id =
    typeof idValue === "number" ? idValue : Number.isFinite(numericId) ? numericId : null;

  if (id === null) return null;

  return {
    id,
    name: resolved.name ?? resolved.categoryname ?? "",
    description: resolved.description ?? resolved.categorydescription ?? "",
    status: toBoolean(resolved.status ?? resolved.isactive),
    icon: resolved.icon ?? null,
  };
};

const extractPayloadCategory = (response: any): Category | null => {
  return parseCategoryPayload(response);
};

export const useCategories = () => {
  const PAGE_SIZE = 5;
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
    const list = (await getCategories()) as Category[];
    setCategories(list);
    return list;
  }, []);

  const refreshCategories = useCallback(
    async (targetPage: number = currentPage, searchText: string = search) => {
      const response = (await getCategories({
        page: targetPage,
        limit: PAGE_SIZE,
        search: searchText,
      })) as CategoriesPaginatedResult;

      const list = Array.isArray(response?.data) ? response.data : [];
      const meta = response?.meta;

      setPagedCategories(list);
      setCurrentPage(Number(meta?.page ?? targetPage));
      setTotalPages(Math.max(1, Number(meta?.totalPages ?? 1)));
      return { list, meta };
    },
    [currentPage, search],
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
    [refreshCategories, search],
  );

  const handleSearchChange = useCallback(
    async (value: string) => {
      setSearch(value);
      setLoading(true);
      try {
        await refreshCategories(1, value);
      } catch (error) {
        console.error("Error al buscar categorias:", error);
        showError("No se pudo buscar categorias.");
      } finally {
        setLoading(false);
      }
    },
    [refreshCategories],
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
    [refreshAllCategories, refreshCategories, refreshCategoryProductCounts, search],
  );

  const handleEditCategory = useCallback(
    async (id: number, categoryData: EditCategoryData) => {
      setLoading(true);
      try {
        const response = await updateCategory(id, categoryData);
        const updatedCategory = extractPayloadCategory(response);

        if (updatedCategory) {
          setPagedCategories((prev) =>
            prev.map((item) => (item.id === updatedCategory.id ? updatedCategory : item)),
          );
          setCategories((prev) =>
            prev.map((item) => (item.id === updatedCategory.id ? updatedCategory : item)),
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
    [currentPage, refreshAllCategories, refreshCategories, search],
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
        },
      );
    },
    [currentPage, refreshAllCategories, refreshCategories, refreshCategoryProductCounts, search],
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