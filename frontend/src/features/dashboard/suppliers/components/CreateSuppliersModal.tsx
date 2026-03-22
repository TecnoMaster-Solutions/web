"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Upload } from "lucide-react";
import Modal from "@/features/dashboard/components/Modal";
import { showError, showWarning } from "@/shared/utils/notifications";
import { uploadImageToCloudinary } from "@/shared/utils/cloudinary";
import { getProducts } from "@/features/dashboard/products/api/products.api";
import type { Product } from "@/features/dashboard/products/types/typesProducts";
import {
  hasMissingRequiredSupplierFields,
  mapSupplierApiErrors,
  sanitizeSupplierContact,
  sanitizeSupplierName,
  sanitizeSupplierNit,
  sanitizeSupplierPhone,
  sanitizeSupplierRating,
  type SupplierErrorKey,
  type SupplierErrorMap,
  type SupplierFormValidationFields,
  validateAllSupplierFields,
  validateSupplierField,
} from "@/features/dashboard/suppliers/utils/supplierFormValidation";

export type SupplierSubmitPayload = {
  name: string;
  nit: string;
  phone: string;
  email: string;
  address: string;
  contactName: string;
  status: "Activo" | "Inactivo";
  rating: number;
  imageFile: File | null;
  imageUrl: string | null;
  supplierid?: number;
  productos?: Array<{
    productoId: number;
    productName?: string;
    precioUnitario: number;
    image?: string;
  }>;
};

type SupplierForm = SupplierFormValidationFields;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SupplierSubmitPayload) => void | Promise<void>;
  title?: string;
};

const initialForm: SupplierForm = {
  name: "",
  nit: "",
  phone: "",
  email: "",
  address: "",
  rating: 0,
  contactName: "",
  imageFile: null,
  imageUrl: null,
};

function roundToStep(n: number, step = 0.1) {
  const rounded = Math.round(n / step) * step;
  return Number(Math.max(0, Math.min(5, rounded)).toFixed(1));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function DecimalStarRating({
  value,
  onChange,
  disabled,
  step = 0.1,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  step?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  const pickValueFromClientX = (clientX: number) => {
    const el = ref.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const raw = (x / rect.width) * 5;
    return roundToStep(raw, step);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(pickValueFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const nextValue = pickValueFromClientX(e.clientX);
    setHover(nextValue);
    if (e.buttons === 1) onChange(nextValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(roundToStep(value + step, step));
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(roundToStep(value - step, step));
    }
    if (e.key === "Home") {
      e.preventDefault();
      onChange(0);
    }
    if (e.key === "End") {
      e.preventDefault();
      onChange(5);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        ref={ref}
        className={`flex items-center gap-1 select-none ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={handleKeyDown}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Calificacion"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={Number(value.toFixed(1))}
        aria-valuetext={`${Number(value.toFixed(1))} de 5`}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const fill = clamp(display - i, 0, 1);
          const pct = `${fill * 100}%`;

          return (
            <div key={i} className="relative h-5 w-5">
              <Star className="h-5 w-5 text-gray-300 pointer-events-none" strokeWidth={1.5} />
              <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ width: pct }}>
                <Star className="h-5 w-5 text-yellow-500" strokeWidth={1.5} fill="currentColor" />
              </div>
            </div>
          );
        })}
      </div>

      <span className="text-xs text-gray-600">{Number(value).toFixed(1)} / 5.0</span>
    </div>
  );
}

export default function CreateSuppliersModal({
  isOpen,
  onClose,
  onSave,
  title = "Crear Proveedor",
}: Props) {
  const [form, setForm] = useState<SupplierForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<SupplierErrorMap>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<
    Array<{
      productoId: number;
      productName: string;
      precioUnitario: number;
    }>
  >([]);

  const filteredProducts = allProducts.filter(
    (p) =>
      !supplierProducts.some((sp) => sp.productoId === p.id) &&
      p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddProduct = (product: Product) => {
    setSupplierProducts((prev) => [
      ...prev,
      {
        productoId: product.id,
        productName: product.name,
        precioUnitario: product.supplierPrice ?? 0,
      },
    ]);
    setProductSearch("");
    setDropdownOpen(false);
  };

  const handleRemoveProduct = (productoId: number) => {
    setSupplierProducts((prev) => prev.filter((p) => p.productoId !== productoId));
  };

  const handleUpdateProductPrice = (productoId: number, precioUnitario: number) => {
    setSupplierProducts((prev) =>
      prev.map((p) => (p.productoId === productoId ? { ...p, precioUnitario } : p))
    );
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setErrors({});
      setSupplierProducts([]);
      setProductSearch("");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setLoadingProducts(true);
    getProducts({ status: "active", page: 1, limit: 1000 })
      .then((response) => setAllProducts(response.data))
      .catch(() => showError("Error al cargar productos."))
      .finally(() => setLoadingProducts(false));
  }, [isOpen]);

  const validateAndSet = (key: SupplierErrorKey, nextForm: SupplierForm) => {
    const message = validateSupplierField(key, nextForm, { imageRequired: true });
    setErrors((current) => ({ ...current, [key]: message }));
    return message;
  };

  const update = <K extends keyof SupplierForm>(key: K, value: SupplierForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name") validateAndSet("name", next);
      if (key === "nit") validateAndSet("nit", next);
      if (key === "phone") validateAndSet("phone", next);
      if (key === "email") validateAndSet("email", next);
      if (key === "address") validateAndSet("address", next);
      if (key === "contactName") validateAndSet("contactName", next);
      if (key === "rating") validateAndSet("rating", next);
      return next;
    });
  };

  const handlePickFile = () => {
    fileRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    setForm((prev) => {
      const next = {
        ...prev,
        imageFile: file,
        imageUrl: file ? URL.createObjectURL(file) : null,
      };
      const message = validateSupplierField("image", next, { imageRequired: true });
      setErrors((current) => ({ ...current, image: message }));
      if (message) showError(message);
      return next;
    });
  };

  const validateAll = () => {
    const nextErrors = validateAllSupplierFields(form, { imageRequired: true });
    setErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors && hasMissingRequiredSupplierFields(form, { imageRequired: true })) {
      showWarning("Completa los campos obligatorios.");
    }

    return !hasErrors;
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!validateAll()) return;

    const imageError = validateSupplierField("image", form, { imageRequired: true });
    if (imageError) {
      setErrors((current) => ({ ...current, image: imageError }));
      showError(imageError);
      return;
    }

    try {
      setSaving(true);

      let finalImageUrl: string | null = form.imageUrl;
      if (form.imageFile) finalImageUrl = await uploadImageToCloudinary(form.imageFile);

      await onSave({
        name: form.name.trim(),
        nit: form.nit.trim(),
        phone: sanitizeSupplierPhone(form.phone),
        email: form.email.trim(),
        address: form.address.trim(),
        contactName: form.contactName.trim(),
        status: "Activo",
        rating: sanitizeSupplierRating(form.rating),
        imageFile: null,
        imageUrl: finalImageUrl ?? null,
        productos: supplierProducts.map((p) => ({
          productoId: p.productoId,
          precioUnitario: p.precioUnitario,
        })),
      });

      setForm(initialForm);
      setErrors({});
      if (fileRef.current) fileRef.current.value = "";
      onClose();
    } catch (error) {
      const { errors: apiErrors, notificationMessage } = mapSupplierApiErrors(error);
      if (Object.keys(apiErrors).length > 0) {
        setErrors((current) => ({ ...current, ...apiErrors }));
      }
      showError(notificationMessage);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="cursor-pointer px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-200 disabled:opacity-60"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="create-supplier-form"
        disabled={saving}
        className="cursor-pointer px-4 py-2 rounded-lg bg-[#2a9781] text-white hover:bg-[#227a69] disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose} footer={footer}>
      <form id="create-supplier-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 p-1">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre <span className="text-green-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => update("name", sanitizeSupplierName(e.target.value))}
            onBlur={() => validateAndSet("name", form)}
            placeholder="Ingrese el nombre"
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Nit(Sin indicativo) <span className="text-green-500">*</span>
          </label>
          <input
            value={form.nit}
            onChange={(e) => update("nit", sanitizeSupplierNit(e.target.value))}
            onBlur={() => validateAndSet("nit", form)}
            placeholder="900123456"
            inputMode="text"
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.nit && <p className="text-xs text-red-600 mt-1">{errors.nit}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Telefono <span className="text-green-500">*</span>
          </label>
          <input
            value={form.phone}
            onChange={(e) => update("phone", sanitizeSupplierPhone(e.target.value))}
            onBlur={() => validateAndSet("phone", form)}
            placeholder="+57 3001234567"
            inputMode="tel"
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Correo <span className="text-green-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            onBlur={() => validateAndSet("email", form)}
            placeholder="correo@dominio.com"
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">
            Direccion <span className="text-green-500">*</span>
          </label>
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            onBlur={() => validateAndSet("address", form)}
            placeholder="Calle 123 #45-67"
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre del contacto <span className="text-green-500">*</span>
          </label>
          <input
            value={form.contactName}
            onChange={(e) => update("contactName", sanitizeSupplierContact(e.target.value))}
            onBlur={() => validateAndSet("contactName", form)}
            placeholder="Nombre del contacto"
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.contactName && <p className="text-xs text-red-600 mt-1">{errors.contactName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Imagen <span className="text-green-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div
              onClick={handlePickFile}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-gray-500 cursor-pointer overflow-hidden"
              role="button"
              aria-label="Seleccionar imagen"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handlePickFile();
              }}
            >
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <Upload size={16} />
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
              onBlur={() => validateAndSet("image", form)}
            />
          </div>
          {errors.image && <p className="text-xs text-red-600 mt-1">{errors.image}</p>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Calificacion</label>
          <DecimalStarRating
            value={sanitizeSupplierRating(form.rating)}
            onChange={(value) => update("rating", value)}
            disabled={saving}
            step={0.1}
          />
        </div>

        <div className="col-span-2 mt-4">
          <label className="block text-sm font-medium mb-2">Productos Asociados</label>

          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              placeholder="Buscar producto para asociar..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => {
                setDropdownOpen(true);
                if (allProducts.length === 0 && !loadingProducts) {
                  setLoadingProducts(true);
                  getProducts({ status: "active", page: 1, limit: 1000 })
                    .then((response) => setAllProducts(response.data))
                    .catch(() => showError("Error al cargar productos."))
                    .finally(() => setLoadingProducts(false));
                }
              }}
              disabled={loadingProducts}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                {loadingProducts ? (
                  <p className="p-2 text-xs text-gray-500">Cargando productos...</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="p-2 text-xs text-gray-500">No se encontraron productos</p>
                ) : (
                  filteredProducts.slice(0, 10).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="px-3 py-2 cursor-pointer hover:bg-green-50 text-sm border-b last:border-b-0"
                    >
                      <div className="font-medium">{product.name}</div>
                      {product.supplierPrice && (
                        <div className="text-xs text-gray-500">
                          ${product.supplierPrice.toLocaleString("es-CO")}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {supplierProducts.length > 0 && (
            <div className="mt-3 space-y-2">
              {supplierProducts.map((product) => (
                <div
                  key={product.productoId}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border"
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium">{product.productName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Precio:</label>
                    <input
                      type="number"
                      value={product.precioUnitario}
                      onChange={(e) =>
                        handleUpdateProductPrice(product.productoId, Number(e.target.value))
                      }
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.productoId)}
                    className="p-1 hover:bg-red-100 rounded"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {supplierProducts.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              No hay productos asociados. Puede agregar productos para filtrarlos en ordenes de compra.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
