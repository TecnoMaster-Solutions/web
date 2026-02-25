"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Upload } from "lucide-react";
import Modal from "@/features/dashboard/components/Modal";
import { showError, showWarning } from "@/shared/utils/notifications";
import { uploadImageToCloudinary } from "@/shared/utils/cloudinary";

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
};

type SupplierForm = {
  name: string;
  nit: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  contactName: string;
  imageFile: File | null;
  imageUrl: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SupplierSubmitPayload) => void | Promise<void>;
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
  imageFile: null,
  imageUrl: null,
};

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

function sanitizeName(v: string) {
  return v.replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ'’.\- ]/g, "").replace(/\s{2,}/g, " ").slice(0, 80);
}
function sanitizeContact(v: string) {
  return v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’.\- ]/g, "").replace(/\s{2,}/g, " ").slice(0, 80);
}
function sanitizePhone(v: string) {
  let s = v.replace(/[^\d+]/g, "");
  if (s.includes("+")) s = "+" + s.replace(/\+/g, "");
  if (s.startsWith("+")) s = "+" + s.slice(1).replace(/[^\d]/g, "");
  return s.slice(0, 16);
}
function sanitizeNITBaseOnly(v: string) {
  return String(v ?? "").replace(/[^\d]/g, "").slice(0, 12);
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
  rating: () => null,
  imageFile: () => null,
  imageUrl: () => null,
  image: (file: File | null) => {
    if (!file) return "Imagen requerida.";
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

export default function CreateSuppliersModal({ isOpen, onClose, onSave, title = "Crear Proveedor" }: Props) {
  const [form, setForm] = useState<SupplierForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setErrors({});
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [isOpen]);

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
      if (k === "rating") validateAndSet("rating", next);
      return next;
    });
  };

  function handlePickFile() {
    fileRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    setForm((prev) => {
      const next = {
        ...prev,
        imageFile: file,
        imageUrl: file ? URL.createObjectURL(file) : null,
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

    const imgErr = validators.image(form.imageFile, form);
    if (imgErr) {
      setErrors((er) => ({ ...er, image: imgErr }));
      showError(imgErr);
      return;
    }

    try {
      setSaving(true);

      let finalImageUrl: string | null = form.imageUrl;
      if (form.imageFile) finalImageUrl = await uploadImageToCloudinary(form.imageFile);

      const payload: SupplierSubmitPayload = {
        name: form.name.trim(),
        nit: nitBase,
        phone: sanitizePhone(form.phone),
        email: form.email.trim(),
        address: form.address.trim(),
        contactName: form.contactName.trim(),
        status: "Activo",
        rating: sanitizeRating(form.rating),
        imageFile: null,
        imageUrl: finalImageUrl ?? null,
      };

      await onSave(payload);

      setForm(initialForm);
      setErrors({});
      if (fileRef.current) fileRef.current.value = "";
      onClose();
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
        form="create-supplier-form"
        disabled={saving}
        className="cursor-pointer px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900 disabled:opacity-60"
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
            Nombre <span className="text-red-500">*</span>
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
            Nit(Sin indicativo) <span className="text-red-500">*</span>
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
            Teléfono <span className="text-red-500">*</span>
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
            Correo <span className="text-red-500">*</span>
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
            Dirección <span className="text-red-500">*</span>
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
            Nombre del contacto <span className="text-red-500">*</span>
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
          <label className="block text-sm font-medium mb-1">
            Imagen <span className="text-red-500">*</span>
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
              accept="image/*"
              className="hidden"
              onChange={handleFile}
              onBlur={() => validateAndSet("image", form)}
            />
          </div>
          {errors.image && <p className="text-xs text-red-600 mt-1">{errors.image}</p>}
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
      </form>
    </Modal>
  );
}
