"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showSuccess, showWarning } from "@/shared/utils/notifications";
import { confirmDelete } from "@/shared/utils/Delete/confirmDelete";
import { uploadImageToCloudinary } from "@/shared/utils/cloudinary";

import type {
  Product,
  CreateProductData,
  EditProductData,
} from "../types/typesProducts";
import type { UpdateProductPayload, StatusQuery } from "../api/products.api";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  getProductDeletionInfo,
  type ProductDeletionInfo,
} from "../api/products.api";

type ApiErrorShape = {
  response?: { data?: { message?: string } };
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const e = error as ApiErrorShape | null;
  return e?.response?.data?.message ?? e?.message ?? fallback;
};

const MAX_IMAGES = 6;

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const [loadingCount, setLoadingCount] = useState(0);
  const loading = loadingCount > 0;
  const startLoading = () => setLoadingCount((c) => c + 1);
  const stopLoading = () => setLoadingCount((c) => Math.max(0, c - 1));

  const [tableLoading, setTableLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const status: StatusQuery = "all";

  const isEditModalOpen = useMemo(() => editingProduct !== null, [editingProduct]);
  const isViewModalOpen = useMemo(() => viewingProduct !== null, [viewingProduct]);
  const selectedProduct = editingProduct ?? viewingProduct ?? null;

  const firstLoadRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const waitForRender = useCallback(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchProducts = useCallback(
    async (customPage: number, customLimit: number, customSearch: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (firstLoadRef.current) {
        startLoading();
      } else {
        setTableLoading(true);
      }

      try {
        const response = await getProducts({
          page: customPage,
          limit: customLimit,
          search: customSearch,
          status,
          signal: controller.signal,
        });

        const sorted = [...response.data].sort(
          (a, b) => Number(b.id ?? 0) - Number(a.id ?? 0)
        );

        setProducts(sorted);
        setTotal(Number(response.meta.total ?? 0));
        setTotalPages(Number(response.meta.totalPages ?? 1));
        await waitForRender();
      } catch (error: any) {
        if (
          error?.name !== "AbortError" &&
          error?.code !== "ERR_CANCELED" &&
          error?.name !== "CanceledError"
        ) {
          console.error("Error al cargar productos:", error);
          showWarning("Error al cargar productos desde el servidor");
        }
      } finally {
        if (firstLoadRef.current) {
          stopLoading();
          firstLoadRef.current = false;
        } else {
          setTableLoading(false);
        }
      }
    },
    [status, waitForRender]
  );

  useEffect(() => {
    fetchProducts(page, limit, debouncedSearch);

    return () => {
      abortRef.current?.abort();
    };
  }, [page, limit, debouncedSearch, fetchProducts]);

  const refreshProducts = useCallback(async () => {
    await fetchProducts(page, limit, debouncedSearch);
    return 200 as const;
  }, [fetchProducts, page, limit, debouncedSearch]);

  const normalizeToUrl = async (item: File | string) => {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) throw new Error("Imagen inválida.");
      return trimmed;
    }

    const url = await uploadImageToCloudinary(item);
    if (!url?.trim()) throw new Error("No se pudo subir una imagen a Cloudinary.");
    return url.trim();
  };

  const requireImagesUrls = async (
    images: Array<File | string> | null | undefined
  ) => {
    const list = (images ?? []).filter(Boolean);

    if (list.length === 0) {
      throw new Error("Debe agregar al menos una imagen para el producto.");
    }

    if (list.length > MAX_IMAGES) {
      throw new Error(`Máximo ${MAX_IMAGES} imágenes por producto.`);
    }

    const urls: string[] = [];
    for (const img of list) {
      urls.push(await normalizeToUrl(img));
    }

    return Array.from(new Set(urls)).slice(0, MAX_IMAGES);
  };

  const handleCreateProduct = async (payload: CreateProductData) => {
    startLoading();
    try {
      setIsCreateModalOpen(false);

      if (!payload.name?.trim()) {
        throw new Error("El nombre del producto es obligatorio.");
      }
      if (!payload.categoryId) {
        throw new Error("Debe seleccionar una categoría.");
      }
      if (!payload.supplierCategory?.trim()) {
        throw new Error("La categoría del proveedor es obligatoria.");
      }
      if (!payload.code?.trim()) {
        throw new Error("El código es obligatorio.");
      }

      const imagesUrls = await requireImagesUrls(payload.images);

      await createProduct({
        productname: payload.name.trim(),
        productdescription: (payload.description ?? "").trim() || null,
        categoryid: payload.categoryId,
        suppliercategory: payload.supplierCategory.trim(),
        images: imagesUrls,
        productcode: payload.code.trim(),
        isactive: true,
      });

      await refreshProducts();
      showSuccess("Producto creado exitosamente");
      await waitForRender();
    } catch (error: unknown) {
      const msg = getErrorMessage(error, "Error al crear producto");
      console.error(error);
      showWarning(msg);
    } finally {
      stopLoading();
    }
  };

  const handleEditProduct = async (id: number, payload: EditProductData) => {
    startLoading();
    try {
      if (!id) return;

      if (!payload.name?.trim()) {
        throw new Error("El nombre del producto es obligatorio.");
      }
      if (!payload.categoryId) {
        throw new Error("Debe seleccionar una categoría.");
      }
      if (!payload.supplierCategory?.trim()) {
        throw new Error("La categoría del proveedor es obligatoria.");
      }
      if (!payload.code?.trim()) {
        throw new Error("El código es obligatorio.");
      }

      const body: UpdateProductPayload = {
        productname: payload.name.trim(),
        productdescription: (payload.description ?? "").trim() || null,
        categoryid: payload.categoryId,
        suppliercategory: payload.supplierCategory.trim(),
        productcode: payload.code?.trim(),
        isactive: payload.state === "Activo",
      };

      const imagesUrls = await requireImagesUrls(payload.images);
      body.images = imagesUrls;

      await updateProduct(id, body);
      await refreshProducts();

      showSuccess("Producto actualizado exitosamente");
      await waitForRender();
      setEditingProduct(null);
    } catch (error: unknown) {
      const msg = getErrorMessage(error, "Error al actualizar producto");
      console.error(error);
      showWarning(msg);
    } finally {
      stopLoading();
    }
  };

  const handleDeleteProduct = async (product: Product): Promise<boolean> => {
    let info: ProductDeletionInfo | null = null;

    startLoading();
    try {
      info = await getProductDeletionInfo(product.id);
    } catch (error: unknown) {
      console.error(error);
      info = null;
    } finally {
      stopLoading();
    }

    if (info?.canDelete === true) {
      return confirmDelete(
        {
          itemName: product.name,
          itemType: "producto",
          title: "Eliminar producto",
          customMessage: `¿Deseas eliminar definitivamente "${product.name}"? Esta acción no se puede deshacer.`,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
          skipSuccessToast: true,
          errorMessage: "No se pudo eliminar el producto. Intenta nuevamente.",
        },
        async () => {
          startLoading();
          try {
            await deleteProduct(product.id);
            await refreshProducts();
            await waitForRender();
            showSuccess(`El producto "${product.name}" se eliminó correctamente.`);
          } finally {
            stopLoading();
          }
        }
      );
    }

    if (info?.canDelete === false) {
      const reason =
        info.reason?.trim() || "Está asociado a compras/órdenes/ventas u otros registros.";
      const isAlreadyInactive = product.state === "Inactivo";

      if (isAlreadyInactive || info.canDeactivate === false) {
        return confirmDelete(
          {
            itemName: product.name,
            itemType: "producto",
            title: "No se puede eliminar",
            customMessage:
              `El producto "${product.name}" no se puede eliminar.\n` +
              `${reason}\n\n` +
              `Este producto ya se encuentra desactivado o no se puede desactivar.`,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: "Cerrar",
            skipSuccessToast: true,
          },
          async () => {}
        );
      }

      return confirmDelete(
        {
          itemName: product.name,
          itemType: "producto",
          title: "No se puede eliminar",
          customMessage:
            `El producto "${product.name}" no se puede eliminar.\n` +
            `${reason}\n\n` +
            `¿Deseas desactivarlo?`,
          confirmButtonText: "Sí, desactivar",
          cancelButtonText: "Cancelar",
          skipSuccessToast: true,
          errorMessage: "No se pudo desactivar el producto. Intenta nuevamente.",
        },
        async () => {
          startLoading();
          try {
            await updateProduct(product.id, { isactive: false });
            await refreshProducts();
            await waitForRender();
            showSuccess(`El producto "${product.name}" se desactivó correctamente.`);
          } finally {
            stopLoading();
          }
        }
      );
    }

    return confirmDelete(
      {
        itemName: product.name,
        itemType: "producto",
        title: "Eliminar producto",
        customMessage:
          `¿Deseas eliminar "${product.name}"?\n\n` +
          `Si está asociado a registros, el sistema podría desactivarlo en lugar de eliminarlo.`,
        confirmButtonText: "Continuar",
        cancelButtonText: "Cancelar",
        skipSuccessToast: true,
        errorMessage: "No se pudo eliminar/desactivar el producto. Intenta nuevamente.",
      },
      async () => {
        startLoading();
        try {
          await deleteProduct(product.id);
          await refreshProducts();
          await waitForRender();
          showSuccess(`Acción aplicada sobre "${product.name}".`);
        } finally {
          stopLoading();
        }
      }
    );
  };

  return {
    products,
    loading,
    tableLoading,

    page,
    limit,
    total,
    totalPages,
    search,
    setPage,
    setLimit,
    setSearch,

    isCreateModalOpen,
    setIsCreateModalOpen,

    isEditModalOpen,
    isViewModalOpen,

    editingProduct,
    viewingProduct,
    selectedProduct,

    setEditingProduct,
    setViewingProduct,

    handleCreateProduct,
    handleEditProduct,
    handleDelete: handleDeleteProduct,

    refreshProducts,
  };
};