"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import Colors from "@/shared/theme/colors";

import { useCategories } from "@/features/dashboard/CategoryProducts/hooks/useCategories";
import type { Category } from "@/features/dashboard/CategoryProducts/types/typeCategoryProducts";

import type { Product, CreateProductData } from "@/features/dashboard/products/types/typesProducts";
import {
  validateProductField,
  validateProductForm,
  type ProductErrors,
  type ProductFormField,
  type ProductFormDraft,
} from "@/features/dashboard/products/validations/productsValidations";

import { showWarning } from "@/shared/utils/notifications";
import { Plus, UploadCloud, X, Star } from "lucide-react";

type CategoryOption = Pick<Category, "id" | "name">;

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProductData) => void | Promise<void>;
  products: Product[];
}

const MAX_IMAGES = 6;

const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  products,
}) => {
  const { categories } = useCategories() as { categories: CategoryOption[] };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [supplierCategory, setSupplierCategory] = useState("");
  const [code, setCode] = useState<string>("");

  const [categoryId, setCategoryId] = useState<string>("");

  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<ProductErrors>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateField = (field: ProductFormField, value: unknown) => {
    const error = validateProductField(field, value, products);
    setErrors((prev) => {
      const next = { ...prev } as any;
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSupplierCategory("");
    setCode("");
    setCategoryId("");
    setImages([]);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const previews = useMemo(() => {
    return images.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
  }, [images]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const addFiles = (files: File[]) => {
    const onlyImages = files.filter((f) => f.type.startsWith("image/"));

    const existingKey = new Set(images.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
    const deduped = onlyImages.filter(
      (f) => !existingKey.has(`${f.name}-${f.size}-${f.lastModified}`)
    );

    const next = [...images, ...deduped].slice(0, MAX_IMAGES);
    setImages(next);
    validateField("images" as any, next);
  };

  const removeAt = (idx: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      validateField("images" as any, next);
      return next;
    });
  };

  const setAsPrimary = (idx: number) => {
    if (idx <= 0) return;
    setImages((prev) => {
      const picked = prev[idx];
      const next = [picked, ...prev.filter((_, i) => i !== idx)];
      validateField("images" as any, next);
      return next;
    });
  };

  const openPicker = () => fileInputRef.current?.click();
  const canAddMore = images.length < MAX_IMAGES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const draft: ProductFormDraft = {
      name,
      description: description ?? null,
      supplierCategory,
      categoryId,
      code,
      images,
    } as any;

    const formErrors = validateProductForm(draft, products);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      showWarning("Por favor completa los campos requeridos", { autoClose: 5000 });
      return;
    }

    if (images.length === 0) {
      setErrors((prev) => ({ ...(prev as any), images: "Debe seleccionar al menos una imagen" }));
      showWarning("Debe seleccionar al menos una imagen", { autoClose: 5000 });
      return;
    }

    const payload: CreateProductData = {
      name: name.trim(),
      description: description ?? null,
      supplierCategory: supplierCategory.trim(),
      code: code.trim(),
      categoryId: Number(categoryId),
      images,
    } as any;

    await onSave(payload);
    resetForm();
    onClose();
  };

  return (
    <Modal
      title="Crear Producto"
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      widthClass="md:max-w-4xl"
      footer={
        <div className="flex justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="create-product-form"
            className="cursor-pointer transition duration-300 hover:bg-black hover:text-white hover:scale-105 px-4 py-2 rounded-lg bg-black text-white w-full sm:w-auto"
          >
            Guardar
          </button>
        </div>
      }
    >
      <form
        id="create-product-form"
        onSubmit={handleSubmit}
        className="flex flex-col"
        style={{ maxHeight: "70vh" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1 min-h-0">
          {/* IZQUIERDA */}
          <div className="min-h-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.texts.primary }}>
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  placeholder="Panel solar 550W"
                  onChange={(e) => {
                    setName(e.target.value);
                    validateField("name", e.target.value);
                  }}
                  onBlur={() => validateField("name", name)}
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ borderColor: (errors as any).name ? "red" : Colors.table.lines }}
                />
                {(errors as any).name && <span className="text-xs text-red-500">{(errors as any).name}</span>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.texts.primary }}>
                  Categoría del proveedor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={supplierCategory}
                  placeholder="Paneles solares ahorrativos"
                  onChange={(e) => {
                    setSupplierCategory(e.target.value);
                    validateField("supplierCategory", e.target.value);
                  }}
                  onBlur={() => validateField("supplierCategory", supplierCategory)}
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ borderColor: (errors as any).supplierCategory ? "red" : Colors.table.lines }}
                />
                {(errors as any).supplierCategory && (
                  <span className="text-xs text-red-500">{(errors as any).supplierCategory}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.texts.primary }}>
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    validateField("categoryId", e.target.value);
                  }}
                  onBlur={() => validateField("categoryId", categoryId)}
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ borderColor: (errors as any).categoryId ? "red" : Colors.table.lines }}
                >
                  <option value="" disabled>
                    Seleccione una categoría...
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {(errors as any).categoryId && <span className="text-xs text-red-500">{(errors as any).categoryId}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.texts.primary }}>
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  placeholder="PROD-001"
                  onChange={(e) => {
                    setCode(e.target.value);
                    validateField("code", e.target.value);
                  }}
                  onBlur={() => validateField("code", code)}
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ borderColor: (errors as any).code ? "red" : Colors.table.lines }}
                />
                {(errors as any).code && <span className="text-xs text-red-500">{(errors as any).code}</span>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: Colors.texts.primary }}>
                  Descripción
                </label>
                <textarea
                  value={description}
                  placeholder="Panel solar monocristalino..."
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border rounded-md resize-none"
                  style={{ borderColor: Colors.table.lines }}
                />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex flex-col">
            <div className="flex items-end justify-between mb-2">
              <label className="block text-sm font-medium" style={{ color: Colors.texts.primary }}>
                Imágenes <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-3">

                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setImages([]);
                      validateField("images" as any, []);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div
              className="rounded-md border bg-white flex flex-col min-h-0"
              style={{ borderColor: (errors as any).images ? "red" : Colors.table.lines }}
            >
              <div className="px-3 py-3 border-b bg-gray-50" style={{ borderColor: Colors.table.lines }}>

                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-gray-600 leading-4">
                    PNG, JPG, WEBP · Máximo {MAX_IMAGES} imágenes
                    <div className="mt-1">
                      Selecciona una imagen para marcarla como principal.
                    </div>
                  </div>

                  <span className="text-xs text-gray-500 font-medium">
                    {images.length}/{MAX_IMAGES}
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length === 0) return;
                    addFiles(files);
                    e.currentTarget.value = "";
                  }}
                />
              </div>

              <div className="p-3 min-h-0 overflow-y-auto" style={{ maxHeight: "42vh" }}>
                {previews.length === 0 ? (
                  <div
                    onClick={() => (canAddMore ? openPicker() : undefined)}
                    className="border border-dashed rounded-md bg-gray-50 hover:bg-gray-100 transition cursor-pointer h-44 flex flex-col items-center justify-center text-center gap-2"
                    style={{ borderColor: "#9CA3AF" }}
                  >
                    <UploadCloud size={22} />
                    <div className="text-sm font-medium text-gray-700">Sube tus imágenes</div>
                    <div className="text-xs text-gray-500">Haz clic para seleccionar</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {previews.map((p, idx) => (
                      <div
                        key={`${p.file.name}-${p.file.size}-${p.file.lastModified}-${idx}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setAsPrimary(idx)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setAsPrimary(idx);
                          }
                        }}
                        className={[
                          "relative rounded-md overflow-hidden border bg-white text-left group cursor-pointer focus:outline-none",
                          idx === 0 ? "ring-2 ring-black" : "hover:ring-2 hover:ring-gray-300",
                        ].join(" ")}
                        style={{ borderColor: Colors.table.lines }}
                        title={idx === 0 ? "Imagen principal" : "Clic para marcar como principal"}
                      >
                        <img src={p.url} alt={`img-${idx}`} className="w-full h-24 object-cover" />

                        {idx === 0 ? (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-2 py-[2px] rounded inline-flex items-center gap-1">
                            <Star size={12} />
                            Principal
                          </span>
                        ) : (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-white/80 text-gray-800 px-2 py-[2px] rounded opacity-0 group-hover:opacity-100 transition">
                            Hacer principal
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAt(idx);
                          }}
                          className="absolute top-1 right-1 bg-white/90 rounded-full p-1 hover:bg-white shadow-sm"
                          title="Eliminar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    {canAddMore && (
                      <button
                        type="button"
                        onClick={openPicker}
                        className="rounded-md border border-dashed bg-gray-50 hover:bg-gray-100 transition flex items-center justify-center"
                        style={{ borderColor: "#9CA3AF", height: "96px" }}
                        title="Agregar imágenes"
                      >
                        <div className="flex flex-col items-center gap-1 text-gray-600">
                          <Plus size={18} />
                          <span className="text-xs font-medium">Agregar</span>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {(errors as any).images && (
                  <p className="mt-2 text-xs text-red-600">{(errors as any).images}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProductModal;