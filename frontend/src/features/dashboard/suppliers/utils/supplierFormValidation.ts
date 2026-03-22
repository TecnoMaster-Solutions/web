export const MAX_SUPPLIER_IMAGE_MB = 2;

export type SupplierFormValidationFields = {
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

export type SupplierErrorKey = keyof SupplierFormValidationFields | "image";
export type SupplierErrorMap = Partial<Record<SupplierErrorKey, string | null>>;

type SupplierValidationOptions = {
  imageRequired?: boolean;
};

type ApiErrorShape = {
  response?: {
    data?: {
      message?: string | string[];
      error?: string | string[];
    };
  };
  message?: string;
};

const IMAGE_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export function sanitizeSupplierName(value: string) {
  return value
    .replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ'.\- ]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 80);
}

export function sanitizeSupplierContact(value: string) {
  return value
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ'.\- ]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 80);
}

export function sanitizeSupplierPhone(value: string) {
  let sanitized = value.replace(/[^\d+]/g, "");
  if (sanitized.includes("+")) sanitized = `+${sanitized.replace(/\+/g, "")}`;
  if (sanitized.startsWith("+")) sanitized = `+${sanitized.slice(1).replace(/[^\d]/g, "")}`;
  return sanitized.slice(0, 16);
}

export function sanitizeSupplierNit(value: string) {
  return String(value ?? "").replace(/\s+/g, "").slice(0, 12);
}

export function sanitizeSupplierRating(value: string | number) {
  const parsed = typeof value === "number" ? value : parseFloat(value || "0");
  if (Number.isNaN(parsed)) return 0;
  const clamped = Math.max(0, Math.min(5, parsed));
  return Number(clamped.toFixed(1));
}

function getImageError(
  file: File | null,
  form: SupplierFormValidationFields,
  options: SupplierValidationOptions = {}
) {
  const imageRequired = options.imageRequired ?? true;
  if (!file) {
    if (imageRequired && !form.imageUrl) return "La imagen es obligatoria.";
    return null;
  }
  if (!IMAGE_ALLOWED_TYPES.has(file.type)) {
    return "La imagen debe estar en formato JPG, PNG o WEBP.";
  }
  if (file.size > MAX_SUPPLIER_IMAGE_MB * 1024 * 1024) {
    return `La imagen no debe superar ${MAX_SUPPLIER_IMAGE_MB}MB.`;
  }
  return null;
}

export function validateSupplierField(
  key: SupplierErrorKey,
  form: SupplierFormValidationFields,
  options: SupplierValidationOptions = {}
) {
  switch (key) {
    case "name": {
      const value = String(form.name ?? "").trim();
      if (!value) return "Campo obligatorio.";
      if (value.length < 3) return "Minimo 3 caracteres.";
      if (!/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ'.\- ]+$/.test(value)) {
        return "Solo letras, numeros y espacios.";
      }
      return null;
    }
    case "nit": {
      const value = String(form.nit ?? "").trim();
      if (!value) return "Campo obligatorio.";
      if (!/^\d+$/.test(value)) return "El NIT solo debe contener numeros.";
      if (!/^\d{5,12}$/.test(value)) return "El NIT debe tener entre 5 y 12 digitos.";
      return null;
    }
    case "phone": {
      const value = String(form.phone ?? "").trim();
      if (!value) return "Campo obligatorio.";
      const digits = value.startsWith("+") ? value.slice(1) : value;
      if (!/^\+?\d+$/.test(value)) return "El telefono solo debe contener numeros.";
      if (digits.length < 7 || digits.length > 15) {
        return "El telefono debe tener entre 7 y 15 digitos.";
      }
      return null;
    }
    case "email": {
      const value = String(form.email ?? "").trim();
      if (!value) return "Campo obligatorio.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Correo invalido.";
      return null;
    }
    case "address": {
      return String(form.address ?? "").trim() ? null : "Campo obligatorio.";
    }
    case "contactName": {
      const value = String(form.contactName ?? "").trim();
      if (!value) return "Campo obligatorio.";
      if (value.length < 3) return "Minimo 3 caracteres.";
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'.\- ]+$/.test(value)) {
        return "Solo letras y espacios.";
      }
      return null;
    }
    case "image":
      return getImageError(form.imageFile, form, options);
    case "rating":
    case "imageFile":
    case "imageUrl":
      return null;
    default:
      return null;
  }
}

export function validateAllSupplierFields(
  form: SupplierFormValidationFields,
  options: SupplierValidationOptions = {}
) {
  const errors: SupplierErrorMap = {};
  errors.name = validateSupplierField("name", form, options);
  errors.nit = validateSupplierField("nit", form, options);
  errors.phone = validateSupplierField("phone", form, options);
  errors.email = validateSupplierField("email", form, options);
  errors.address = validateSupplierField("address", form, options);
  errors.contactName = validateSupplierField("contactName", form, options);
  errors.image = validateSupplierField("image", form, options);
  return errors;
}

export function hasMissingRequiredSupplierFields(
  form: SupplierFormValidationFields,
  options: SupplierValidationOptions = {}
) {
  const imageRequired = options.imageRequired ?? true;
  return (
    !String(form.name ?? "").trim() ||
    !String(form.nit ?? "").trim() ||
    !String(form.phone ?? "").trim() ||
    !String(form.email ?? "").trim() ||
    !String(form.address ?? "").trim() ||
    !String(form.contactName ?? "").trim() ||
    (imageRequired && !form.imageFile && !form.imageUrl)
  );
}

function normalizeMessages(err: unknown) {
  const apiError = err as ApiErrorShape | null | undefined;
  const raw =
    apiError?.response?.data?.message ??
    apiError?.response?.data?.error ??
    apiError?.message;

  if (Array.isArray(raw)) return raw.filter((message): message is string => typeof message === "string");
  if (typeof raw === "string" && raw.trim()) return [raw];
  return [];
}

function includesAny(text: string, fragments: string[]) {
  return fragments.some((fragment) => text.includes(fragment));
}

export function mapSupplierApiErrors(err: unknown) {
  const messages = normalizeMessages(err);
  const errors: SupplierErrorMap = {};
  let notificationMessage: string | null = null;

  for (const message of messages) {
    const normalized = message.toLowerCase();

    if (includesAny(normalized, ["nit ya registrado"])) {
      errors.nit = "Ya existe un proveedor con este NIT.";
      notificationMessage ??= errors.nit;
      continue;
    }

    if (includesAny(normalized, ["nombre ya registrado"])) {
      errors.name = "Ya existe un proveedor con este nombre.";
      notificationMessage ??= errors.name;
      continue;
    }

    if (includesAny(normalized, ["correo ya registrado", "email already exists"])) {
      errors.email = "Ya existe un proveedor con este correo electronico.";
      notificationMessage ??= errors.email;
      continue;
    }

    if (includesAny(normalized, ["telefono ya registrado", "teléfono ya registrado"])) {
      errors.phone = "Ya existe un proveedor con este numero de telefono.";
      notificationMessage ??= errors.phone;
      continue;
    }

    if (includesAny(normalized, ["phone must match", "telefono", "teléfono"])) {
      errors.phone = "El telefono debe tener entre 7 y 15 digitos.";
      notificationMessage ??= errors.phone;
      continue;
    }

    if (includesAny(normalized, ["email must be an email", "correo invalido", "correo inválido"])) {
      errors.email = "Correo invalido.";
      notificationMessage ??= errors.email;
      continue;
    }

    if (includesAny(normalized, ["nit must match", "nit debe", "nit solo"])) {
      errors.nit = "El NIT debe tener entre 5 y 12 digitos y solo numeros.";
      notificationMessage ??= errors.nit;
      continue;
    }

    notificationMessage ??= message;
  }

  return {
    errors,
    notificationMessage: notificationMessage ?? "Ocurrio un error al guardar.",
  };
}
