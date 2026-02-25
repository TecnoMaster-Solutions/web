import { CategoryBase, FormErrors } from "../types/typeCategoryProducts";
import { showError, showWarning } from "@/shared/utils/notifications";

/**
 * 🔎 Valida si un nombre de categoría ya existe (case insensitive)
 */
export const isDuplicateName = (
  name: string,
  categories: { name: string; id?: number }[],
  currentId?: number
): boolean => {
  const normalizedName = name.trim().toLowerCase();
  return categories.some(
    (cat) =>
      cat.name.trim().toLowerCase() === normalizedName &&
      cat.id !== currentId
  );
};

/**
 * ✅ Valida campos individuales de la categoría
 */
export const validateField = (
  fieldName: string,
  value: string,
  categories?: { name: string; id?: number }[],
  currentId?: number
): string => {
  if (fieldName === "name") {
    if (!value.trim()) return "El nombre es obligatorio";
    if (value.length < 2) return "El nombre debe tener al menos 2 caracteres";
    if (/[0-9]/.test(value)) return "El nombre no puede contener números";
    if (/[@,.;:\-_\{\[\}^\]`+*~´¨¡¿'\\?=)(/&%$#"!°|¬<>]/.test(value))
      return "El nombre no puede contener caracteres especiales";

    // 🔁 Validación de duplicado en tiempo real
    if (categories && isDuplicateName(value, categories, currentId)) {
      return "Ya existe una categoría con ese nombre";
    }
  }

  if (fieldName === "description") {
    // ✅ Solo validamos longitud (no caracteres especiales)
    if (value.trim() && value.length > 255)
      return "La descripción no puede superar los 255 caracteres";
  }

  return "";
};

/**
 * ✅ Valida todos los campos de la categoría
 */
export const validateAllFields = (
  data: CategoryBase,
  categories?: { name: string; id?: number }[],
  currentId?: number
): FormErrors => {
  return {
    name: validateField("name", data.name, categories, currentId),
    description: validateField("description", data.description),
  };
};

/**
 * ⚠️ Detecta si hay errores
 */
export const hasErrors = (errors: FormErrors): boolean =>
  Object.values(errors).some((e) => e !== "");

/**
 * ✅ Validación completa con notificación al guardar
 */
export const validateFormWithNotification = (
  formData: CategoryBase,
  setErrors: (errors: FormErrors) => void,
  setTouched: (touched: { name: boolean; description: boolean }) => void,
  categories?: { name: string; id?: number }[],
  currentId?: number
): boolean => {
  const newErrors = validateAllFields(formData, categories, currentId);
  setErrors(newErrors);
  setTouched({ name: true, description: true });

  const hasRelevantErrors = hasErrors(newErrors);
  if (hasRelevantErrors) {
    showError("Por favor complete los campos correctamente");
    return false;
  }

  return true;
};
