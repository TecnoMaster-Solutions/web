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
  CreateCategoryData,
  EditCategoryData,
} from "../types/typeCategoryProducts";

const sortCategories = (list: Category[]): Category[] =>
  [...list].sort((a, b) => {
    const nameA = a.name ?? "";
    const nameB = b.name ?? "";
    return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
  });

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
  const numericId =
    typeof idValue === "number" ? idValue : Number(idValue);
  const id =
    typeof idValue === "number"
      ? idValue
      : Number.isFinite(numericId)
        ? numericId
        : null;

  if (id === null) {
    return null;
  }

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<EditCategoryData | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryProductCounts, setCategoryProductCounts] = useState<
    Record<number, number>
  >({});

  const hasFetchedRef = useRef(false);

  const refreshCategoryProductCounts = useCallback(async () => {
    try {
      const products = await getProducts("all");
      const counts: Record<number, number> = {};
      products.forEach((product) => {
        const categoryId = product.categoryId;
        if (!categoryId) return;
        counts[categoryId] = (counts[categoryId] ?? 0) + 1;
      });
      setCategoryProductCounts(counts);
    } catch (error) {
      console.error(
        "Error al cargar productos para verificar las categorías:",
        error,
      );
      setCategoryProductCounts({});
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    const list = await getCategories();
    setCategories(sortCategories(list));
    void refreshCategoryProductCounts();
    await waitForNextRender();
    return list;
  }, [refreshCategoryProductCounts]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await refreshCategories();
      } catch (error) {
        console.error("Error al cargar categorias:", error);
        showError("No se pudieron cargar las categorias.");
      } finally {
        setLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      load();
    }
  }, [refreshCategories]);

  const addCategoryToState = useCallback((category: Category) => {
    setCategories((prev) => sortCategories([...prev, category]));
  }, []);

  const updateCategoryInState = useCallback((category: Category) => {
    setCategories((prev) =>
      sortCategories(prev.map((item) => (item.id === category.id ? category : item))),
    );
  }, []);

  const removeCategoryFromState = useCallback((categoryId: number) => {
    setCategories((prev) =>
      sortCategories(prev.filter((item) => item.id !== categoryId)),
    );
  }, []);

  const handleCreateCategory = useCallback(
    async (categoryData: CreateCategoryData) => {
      setLoading(true);
      try {
        setIsCreateModalOpen(false);

        const response = await createCategory(categoryData);
        const createdCategory = extractPayloadCategory(response);

        if (createdCategory) {
          addCategoryToState(createdCategory);
        } else {
          await refreshCategories();
        }

        showSuccess("Categoria creada exitosamente!");
        await waitForNextRender();
      } catch (error) {
        console.error("Error al crear categoria:", error);
        showError("No se pudo crear la categoria.");
      } finally {
        setLoading(false);
      }
    },
    [addCategoryToState, refreshCategories],
  );

  const handleEditCategory = useCallback(
    async (id: number, categoryData: EditCategoryData) => {
      setLoading(true);
      try {
        const response = await updateCategory(id, categoryData);
        const updatedCategory = extractPayloadCategory(response);

        if (updatedCategory) {
          updateCategoryInState(updatedCategory);
        } else {
          await refreshCategories();
        }

        showSuccess("Categoria actualizada exitosamente!");
        await waitForNextRender();
      } catch (error) {
        console.error("Error al actualizar categoria:", error);
        showError("No se pudo actualizar la categoria.");
      } finally {
        setLoading(false);
        setEditingCategory(null);
      }
    },
    [refreshCategories, updateCategoryInState],
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
            removeCategoryFromState(category.id);
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
    [removeCategoryFromState],
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
    categoryProductCounts,
    loading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingCategory,
    viewingCategory,
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleView,
    handleEdit,
    closeModals,
  };
};
