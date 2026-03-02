"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Upload } from "lucide-react";
import Modal from "@/features/dashboard/components/Modal";
import type { SupplierSubmitPayload } from "@/features/dashboard/suppliers/components/CreateSuppliersModal";
import { showError, showWarning } from "@/shared/utils/notifications";
import { uploadImageToCloudinary } from "@/shared/utils/cloudinary";
import { getProducts } from "@/features/dashboard/products/api/products.api";
import type { Product } from "@/features/dashboard/products/types/typesProducts";
import { getSupplierProducts } from "@/features/dashboard/suppliers/services/suppliers.service";

type SupplierForm = {
  name: string;
  nit: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  contactName: string;
  status: "Activo" | "Inactivo";
  imageFile: File | null;
  imageUrl: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SupplierSubmitPayload) => void | Promise<void>;
  supplier: SupplierSubmitPayload | null;
  title?: string;
};

const MAX_IMG_MB = 2;

const initialForm: SupplierForm = {
  name: "",
  nit: "",
  phone: "",
  email: "",
  address: "",
  rating: 0,
  contactName: "",
  status: "Activo",
  imageFile: null,
  imageUrl: null,
};

function sanitizeName(v: string) {
  return v
    .replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ'’.\- ]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 80);
}
function sanitizeContact(v: string) {
  return v
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’.\- ]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 80);
}
function sanitizePhone(v: string) {
  let s = v.replace(/[^\d+]/g, "");
  if (s.includes("+")) s = "+" + s.replace(/\+/g, "");
  if (s.startsWith("+")) s = "+" + s.slice(1).replace(/[^\d]/g, "");
  return s.slice(0, 16);
}
function sanitizeRating(v: string | number) {
  const n = typeof v === "number" ? v : parseFloat(v || "0");
  if (Number.isNaN(n)) return 0;
  const clamped = Math.max(0, Math.min(5, n));
  return Number(clamped.toFixed(1));
}
function roundToStep(n: number, step = 0.1) {
  const r = Math.round(n / step) * step;
  return Number(Math.max(0, Math.min(5, r)).toFixed(1));
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function sanitizeNITBaseOnly(v: string) {
  return String(v ?? "")
    .replace(/[^\d]/g, "")
    .slice(0, 12);
}

type ErrorMap = Partial<Record<keyof SupplierForm | "image", string | null>>;

const validators: Record<keyof SupplierForm | "image", (value: any, form: SupplierForm) => string | null> = {
  name: (v) => {
    const s = String(v ?? "").trim();
    if (s.length < 3) return "Mínimo 3 caracteres.";
    if (!/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ'’.\- ]+$/.test(s)) return "Solo letras, números y espacios.";
    return null;
  },
  nit: (v) => {
    const raw = String(v ?? "").replace(/[^\d]/g, "");
    if (!/^\d{5,12}$/.test(raw)) return "Debe tener entre 5 y 12 dígitos (solo números).";
    return null;
  },
  phone: (v) => {
    const s = String(v ?? "").replace(/[^\d+]/g, "");
    const digits = s.startsWith("+") ? s.slice(1) : s;
    if (digits.length < 7 || digits.length > 15) return "7–15 dígitos.";
    if (!/^\+?\d+$/.test(s)) return "Solo números.";
    return null;
  },
  email: (v) => {
    const s = String(v ?? "").trim();
    if (!s) return "Correo requerido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "Correo inválido.";
    return null;
  },
  address: (v) => {
    const s = String(v ?? "").trim();
    if (!s) return "Campo obligatorio.";
    return null;
  },
  contactName: (v) => {
    const s = String(v ?? "").trim();
    if (s.length < 3) return "Mínimo 3 caracteres.";
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’.\- ]+$/.test(s)) return "Solo letras y espacios.";
    return null;
  },
  status: () => null,
  rating: () => null,
  imageFile: () => null,
  imageUrl: () => null,
  image: (file: File | null) => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) return "Archivo no es una imagen.";
    if (file.size > MAX_IMG_MB * 1024 * 1024) return `Máx ${MAX_IMG_MB}MB.`;
    return null;
  },
};

function validateAllFields(form: SupplierForm): ErrorMap {
  const e: ErrorMap = {};
  e.name = validators.name(form.name, form);
  e.nit = validators.nit(form.nit, form);
  e.phone = validators.phone(form.phone, form);
  e.email = validators.email(form.email, form);
  e.address = validators.address(form.address, form);
  e.contactName = validators.contactName(form.contactName, form);
  e.image = validators.image(form.imageFile, form);
  return e;
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
    const v = pickValueFromClientX(e.clientX);
    setHover(v);
    if (e.buttons === 1) onChange(v);
  };

  const handlePointerLeave = () => setHover(null);

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
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Calificación"
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

export default function EditSupplierModal({ isOpen, onClose, onSave, supplier, title = "Editar Proveedor" }: Props) {
  const [form, setForm] = useState<SupplierForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [loadedFromProp, setLoadedFromProp] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Estado para productos asociados
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<Array<{
    productoId: number;
    productName: string;
    precioUnitario: number;
    image?: string;
  }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (saving) return;

    if (supplier && !loadedFromProp) {
      const next: SupplierForm = {
        name: supplier.name ?? "",
        nit: String(supplier.nit ?? "").replace(/[^\d]/g, ""),
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        rating: supplier.rating ?? 0,
        contactName: supplier.contactName ?? "",
        status: supplier.status ?? "Activo",
        imageFile: null,
        imageUrl: supplier.imageUrl ?? null,
      };
      setForm(next);
      setErrors(validateAllFields(next));
      
      // Siempre cargar productos desde la API para obtener información completa (incluyendo imagen)
      const supplierId = (supplier as any).supplierid || (supplier as any).id;
      if (supplierId) {
        getSupplierProducts(supplierId)
          .then((products: any) => {
            if (products && products.length > 0) {
              setSupplierProducts(
                products.map((p: { id: number; productName: string; precioUnitario: number; image?: string }) => ({
                  productoId: p.id,
                  productName: p.productName ?? "",
                  precioUnitario: p.precioUnitario ?? 0,
                  image: p.image,
                }))
              );
            }
          })
          .catch(() => {
            // Silently fail - products will just be empty
          });
      }
      
      setLoadedFromProp(true);
    }
  }, [isOpen, supplier, saving, loadedFromProp]);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setErrors({});
      setLoadedFromProp(false);
      setSupplierProducts([]);
      setProductSearch("");
      if (fileRef.current) fileRef.current.value = "";
    } else {
      // Cargar productos del sistema
      setLoadingProducts(true);
      getProducts("active")
        .then((data) => setAllProducts(data))
        .catch(() => showError("Error al cargar productos."))
        .finally(() => setLoadingProducts(false));
    }
  }, [isOpen]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función para filtrar productos
  const filteredProducts = allProducts.filter((p) =>
    !supplierProducts.some((sp) => sp.productoId === p.id) &&
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Función para agregar producto
  const handleAddProduct = (product: Product) => {
    setSupplierProducts((prev) => [
      ...prev,
      {
        productoId: product.id,
        productName: product.name,
        precioUnitario: product.supplierPrice ?? 0,
        image: product.image,
      },
    ]);
    setProductSearch("");
    setDropdownOpen(false);
  };

  // Función para eliminar producto
  const handleRemoveProduct = (productoId: number) => {
    setSupplierProducts((prev) => prev.filter((p) => p.productoId !== productoId));
  };

  // Función para actualizar precio
  const handleUpdateProductPrice = (productoId: number, precioUnitario: number) => {
    setSupplierProducts((prev) =>
      prev.map((p) => (p.productoId === productoId ? { ...p, precioUnitario } : p))
    );
  };

  const validateAndSet = <K extends keyof SupplierForm | "image">(
    key: K,
    nextForm: SupplierForm
  ) => {
    const value = key === "image" ? nextForm.imageFile : nextForm[key as keyof SupplierForm];
    const msg = validators[key](value as any, nextForm);
    setErrors((er) => ({ ...er, [key]: msg }));
    return msg;
  };

  const update = <K extends keyof SupplierForm>(k: K, v: SupplierForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "name") validateAndSet("name", next);
      if (k === "nit") validateAndSet("nit", next);
      if (k === "phone") validateAndSet("phone", next);
      if (k === "email") validateAndSet("email", next);
      if (k === "address") validateAndSet("address", next);
      if (k === "contactName") validateAndSet("contactName", next);
      if (k === "status") validateAndSet("status", next);
      if (k === "rating") validateAndSet("rating", next);
      return next;
    });
  };

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    setForm((prev) => {
      const next = {
        ...prev,
        imageFile: file,
        imageUrl: file ? URL.createObjectURL(file) : prev.imageUrl,
      };
      const err = validators.image(file, next);
      setErrors((er) => ({ ...er, image: err }));
      if (err) showError(err);
      return next;
    });
  }

  function validateAll() {
    const e = validateAllFields(form);
    setErrors(e);

    const hasErrors = Object.values(e).some((v) => Boolean(v));
    if (hasErrors) showWarning("Todos los campos deben estar llenos.");

    return !hasErrors;
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    if (!validateAll()) return;

    const nitBase = String(form.nit ?? "").replace(/[^\d]/g, "");
    if (!/^\d{5,12}$/.test(nitBase)) {
      showError("NIT inválido. Debe tener entre 5 y 12 dígitos (solo números).");
      setErrors((er) => ({ ...er, nit: "Debe tener entre 5 y 12 dígitos (solo números)." }));
      return;
    }

    try {
      setSaving(true);

      let finalImageUrl = form.imageUrl ?? null;
      if (form.imageFile) finalImageUrl = await uploadImageToCloudinary(form.imageFile);

      const payload: SupplierSubmitPayload = {
        name: form.name.trim(),
        nit: nitBase,
        phone: sanitizePhone(form.phone),
        email: form.email.trim(),
        address: form.address.trim(),
        contactName: form.contactName.trim(),
        status: form.status,
        rating: sanitizeRating(form.rating),
        imageFile: null,
        imageUrl: finalImageUrl,
        productos: supplierProducts.map((p) => ({
          productoId: p.productoId,
          precioUnitario: p.precioUnitario,
        })),
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      showError(err?.message || "Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  }

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
        form="edit-supplier-form"
        disabled={saving}
        className="cursor-pointer px-4 py-2 rounded-lg bg-[#2a9781] text-white hover:bg-[#227a69] disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose} footer={footer}>
      <form id="edit-supplier-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 p-1">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre <span className="text-green-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => update("name", sanitizeName(e.target.value))}
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
            onChange={(e) => update("nit", sanitizeNITBaseOnly(e.target.value))}
            onBlur={() => validateAndSet("nit", form)}
            placeholder="900123456"
            inputMode="numeric"
            pattern="\d*"
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.nit && <p className="text-xs text-red-600 mt-1">{errors.nit}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Teléfono <span className="text-green-500">*</span>
          </label>
          <input
            value={form.phone}
            onChange={(e) => update("phone", sanitizePhone(e.target.value))}
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
            Dirección <span className="text-green-500">*</span>
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
            onChange={(e) => update("contactName", sanitizeContact(e.target.value))}
            onBlur={() => validateAndSet("contactName", form)}
            placeholder="Nombre del contacto"
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.contactName && <p className="text-xs text-red-600 mt-1">{errors.contactName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Imagen</label>
          <div className="flex items-center gap-2">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-gray-500 cursor-pointer overflow-hidden"
              role="button"
              tabIndex={0}
              aria-label="Seleccionar imagen"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
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
              accept="image/*"
              className="hidden"
              onChange={handleFile}
              onBlur={() => validateAndSet("image", form)}
            />
          </div>
          {errors.image && <p className="text-xs text-red-600 mt-1">{errors.image}</p>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as "Activo" | "Inactivo")}
            className="w-full px-2 py-1 border rounded-md"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Calificación</label>
          <DecimalStarRating
            value={sanitizeRating(form.rating)}
            onChange={(v) => update("rating", v)}
            disabled={saving}
            step={0.1}
          />
        </div>

        {/* PRODUCTOS ASOCIADOS */}
        <div className="col-span-2 mt-4">
          <label className="block text-sm font-medium mb-2">
            Productos Asociados
          </label>
          
          {/* Buscador de productos */}
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
                // Si no hay productos cargados, recargar
                if (allProducts.length === 0 && !loadingProducts) {
                  setLoadingProducts(true);
                  getProducts("active")
                    .then((data) => setAllProducts(data))
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

          {/* Lista de productos asociados */}
          {supplierProducts.length > 0 && (
            <div className="mt-3 space-y-3">
              {supplierProducts.map((product) => (
                <div
                  key={product.productoId}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border"
                >
                  {/* Imagen del producto */}
                  <div className="shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.productName}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">N/A</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Nombre y precio */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {product.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${product.precioUnitario?.toLocaleString("es-CO") ?? "0"}
                    </p>
                  </div>
                  
                  {/* Input de precio */}
                  <div className="shrink-0">
                    <label className="text-xs text-gray-600 block mb-1">Precio:</label>
                    <input
                      type="number"
                      value={product.precioUnitario}
                      onChange={(e) => handleUpdateProductPrice(product.productoId, Number(e.target.value))}
                      className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  
                  {/* Botón eliminar */}
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.productoId)}
                    className="p-2 hover:bg-red-100 rounded shrink-0"
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
              No hay productos asociados. Puede agregar productos para filtrarlos en órdenes de compra.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}



