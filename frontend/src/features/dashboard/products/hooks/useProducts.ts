"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showSuccess, showWarning } from "@/shared/utils/notifications";
import { confirmDelete } from "@/shared/utils/Delete/confirmDelete";
import { uploadImageToCloudinary } from "@/shared/utils/cloudinary";

import type { Product, CreateProductData, EditProductData } from "../types/typesProducts";
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
  const [loading, setLoading] = useState(true);

  const isEditModalOpen = useMemo(() => editingProduct !== null, [editingProduct]);
  const isViewModalOpen = useMemo(() => viewingProduct !== null, [viewingProduct]);

  const selectedProduct = editingProduct ?? viewingProduct ?? null;

  const waitForRender = useCallback(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }, []);

  const applyProductsResponse = useCallback(
    async (list: Product[]) => {
      const sorted = [...list].sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
      setProducts(sorted);
      await waitForRender();
    },
    [waitForRender]
  );

  const refreshProducts = useCallback(
    async (nextStatus: StatusQuery = "all") => {
      const list = await getProducts(nextStatus);
      await applyProductsResponse(list);
      return 200 as const;
    },
    [applyProductsResponse]
  );

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const code = await refreshProducts("all");
        if (code !== 200) throw new Error(`Refresh products devolvió ${code}`);
      } catch (error: unknown) {
        console.error("Error al cargar productos:", error);
        showWarning("Error al cargar productos desde el servidor");
      } finally {
        setLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      load();
    }
  }, [refreshProducts]);

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

  const requireImagesUrls = async (images: Array<File | string> | null | undefined) => {
    const list = (images ?? []).filter(Boolean);

    if (list.length === 0) throw new Error("Debe agregar al menos una imagen para el producto.");
    if (list.length > MAX_IMAGES) throw new Error(`Máximo ${MAX_IMAGES} imágenes por producto.`);

    const urls: string[] = [];
    for (const img of list) {
      urls.push(await normalizeToUrl(img));
    }

    // dedupe manteniendo orden + cap
    return Array.from(new Set(urls)).slice(0, MAX_IMAGES);
  };

  const handleCreateProduct = async (payload: CreateProductData) => {
    setLoading(true);
    try {
      setIsCreateModalOpen(false);

      if (!payload.name?.trim()) throw new Error("El nombre del producto es obligatorio.");
      if (!payload.categoryId) throw new Error("Debe seleccionar una categoría.");
      if (!payload.supplierCategory?.trim())
        throw new Error("La categoría del proveedor es obligatoria.");
      if (!payload.code?.trim()) throw new Error("El código es obligatorio.");

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

      const code = await refreshProducts("all");
      if (code !== 200) throw new Error(`Refresh products devolvió ${code}`);

      showSuccess("Producto creado exitosamente");
      await waitForRender();
    } catch (error: unknown) {
      const msg = getErrorMessage(error, "Error al crear producto");
      console.error(error);
      showWarning(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (id: number, payload: EditProductData) => {
    setLoading(true);
    try {
      if (!id) return;

      if (!payload.name?.trim()) throw new Error("El nombre del producto es obligatorio.");
      if (!payload.categoryId) throw new Error("Debe seleccionar una categoría.");
      if (!payload.supplierCategory?.trim())
        throw new Error("La categoría del proveedor es obligatoria.");
      if (!payload.code?.trim()) throw new Error("El código es obligatorio.");

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

      const code = await refreshProducts("all");
      if (code !== 200) throw new Error(`Refresh products devolvió ${code}`);

      showSuccess("Producto actualizado exitosamente");
      await waitForRender();
      setEditingProduct(null);
    } catch (error: unknown) {
      const msg = getErrorMessage(error, "Error al actualizar producto");
      console.error(error);
      showWarning(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product): Promise<boolean> => {
    let info: ProductDeletionInfo | null = null;

    setLoading(true);
    try {
      info = await getProductDeletionInfo(product.id);
    } catch (error: unknown) {
      console.error(error);
      info = null;
    } finally {
      setLoading(false);
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
          setLoading(true);
          try {
            await deleteProduct(product.id);

            const code = await refreshProducts("all");
            if (code !== 200) throw new Error(`Refresh products devolvió ${code}`);
            await waitForRender();

            showSuccess(`El producto "${product.name}" se eliminó correctamente.`);
          } finally {
            setLoading(false);
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
          setLoading(true);
          try {
            await updateProduct(product.id, { isactive: false });

            const code = await refreshProducts("all");
            if (code !== 200) throw new Error(`Refresh products devolvió ${code}`);
            await waitForRender();

            showSuccess(`El producto "${product.name}" se desactivó correctamente.`);
          } finally {
            setLoading(false);
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
        setLoading(true);
        try {
          await deleteProduct(product.id);

          const code = await refreshProducts("all");
          if (code !== 200) throw new Error(`Refresh products devolvió ${code}`);
          await waitForRender();

          showSuccess(`Acción aplicada sobre "${product.name}".`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return {
    products,
    loading,

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