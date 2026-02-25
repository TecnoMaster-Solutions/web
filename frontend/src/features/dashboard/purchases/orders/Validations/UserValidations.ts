import { showWarning } from "@/shared/utils/notifications";
import {
  createPurchaseOrderData,
  formErrors,
  formTouched
} from "../types/typesPurchaseOrder";

/* ==================== VALIDACIONES HEADER ==================== */

export const validateField = (
  fieldName: keyof formErrors,
  value: string | undefined | null,
  // extra params ignored for API compatibility
  _formData?: unknown,
  _isEditing?: boolean
): string => {
  let error = "";
  const stringValue = value ? String(value) : "";

  switch (fieldName) {
    case "proveedor":
      if (!stringValue.trim()) {
        error = "El proveedor es obligatorio";
      }
      break;

    case "fecha":
      if (!stringValue.trim()) {
        error = "La fecha es obligatoria";
      } else {
        const fechaSeleccionada = new Date(stringValue);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (isNaN(fechaSeleccionada.getTime())) {
          error = "La fecha no es válida";
        } else if (fechaSeleccionada < hoy) {
          error = "La fecha no puede ser anterior a hoy";
        }
      }
      break;

    case "descripcion":
      if (stringValue.length > 500) {
        error = "La descripción no puede superar 500 caracteres";
      }
      break;

    default:
      break;
  }

  return error;
};

/* ==================== VALIDAR TODOS LOS CAMPOS HEADER ==================== */

export const validateAllFields = (
  formData: createPurchaseOrderData
): formErrors => {
  return {
    proveedor: validateField("proveedor", formData.proveedor),
    fecha: validateField("fecha", formData.fecha),
    descripcion: validateField("descripcion", formData.descripcion)
  };
};

export const hasErrors = (errors: formErrors): boolean => {
  return Object.values(errors).some((error) => error !== "");
};

/* ==================== VALIDACIÓN CON NOTIFICACIONES ==================== */

export const validateFormWithNotification = (
  formData: createPurchaseOrderData,
  setErrors: (errors: formErrors) => void,
  setTouched: (touched: formTouched) => void
): boolean => {
  const newErrors = validateAllFields(formData);

  setErrors(newErrors);

  const allTouched: formTouched = {
    proveedor: true,
    fecha: true,
    descripcion: true
  };

  setTouched(allTouched);

  const firstError = Object.values(newErrors).find(
    (error) => error !== ""
  );

  if (firstError) {
    showWarning("Por favor complete los campos correctamente");
    setTimeout(() => {
      showWarning(firstError);
    }, 100);

    return false;
  }

  return true;
};