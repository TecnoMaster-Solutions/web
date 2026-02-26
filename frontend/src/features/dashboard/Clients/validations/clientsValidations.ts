// ================================
// IMPORTS
// ================================

import { Dispatch, SetStateAction } from "react";
import {
  CreateClientData,
  ClientFormErrors,
  ClientFormTouched,
} from "../types/typeClients";
import { showWarning } from "@/shared/utils/notifications";

// ================================
// REGEX
// ================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const numericRegex = /^[0-9]+$/;
const alphaRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

// ================================
// CAMPOS VALIDABLES
// ================================

type FieldKey =
  | "nombre"
  | "apellido"
  | "documento"
  | "telefono"
  | "correoElectronico"
  | "tipo"
  | "estado"
  | "ciudad"
  | "codigoPostal";

// ================================
// VALIDADORES INDIVIDUALES
// ================================

export const fieldValidators: Record<
  FieldKey,
  (value: string | number) => string
> = {
  nombre: (v) => {
    const value = String(v);
    if (!value.trim()) return "El nombre es obligatorio";
    if (!alphaRegex.test(value))
      return "El nombre solo puede contener letras y espacios";
    if (value.length < 2)
      return "El nombre debe tener mínimo 2 caracteres";
    return "";
  },

  apellido: (v) => {
    const value = String(v);
    if (!value.trim()) return "El apellido es obligatorio";
    if (!alphaRegex.test(value))
      return "El apellido solo puede contener letras y espacios";
    return "";
  },

  documento: (v) => {
    const value = String(v);
    if (!value.trim()) return "El documento es obligatorio";
    if (!numericRegex.test(value))
      return "El documento debe contener solo números";
    if (value.length < 6 || value.length > 15)
      return "El documento debe tener entre 6 y 15 dígitos";
    return "";
  },

  telefono: (v) => {
    const value = String(v);
    if (!value.trim()) return "El teléfono es obligatorio";
    if (!numericRegex.test(value))
      return "El teléfono debe contener solo números";
    if (value.length < 7 || value.length > 10)
      return "El teléfono debe ser un número válido (7-10 dígitos)";
    return "";
  },

  correoElectronico: (v) => {
    const value = String(v);
    if (!value.trim()) return "El correo es obligatorio";
    if (!emailRegex.test(value))
      return "El formato del correo es inválido";
    return "";
  },

  tipo: (v) => {
    if (!v || Number(v) === 0)
      return "El tipo de documento es obligatorio";
    return "";
  },

  estado: (v) => {
    const value = String(v);
    if (!value.trim()) return "El estado es obligatorio";
    if (!["Activo", "Inactivo"].includes(value))
      return "El estado debe ser Activo o Inactivo";
    return "";
  },

  ciudad: (v) => {
    const value = String(v);
    if (!value.trim()) return "La ciudad es obligatoria";
    if (!alphaRegex.test(value))
      return "La ciudad solo puede contener letras";
    return "";
  },

  codigoPostal: (v) => {
    const value = String(v);
    if (!value.trim()) return "El código postal es obligatorio";
    if (!numericRegex.test(value))
      return "El código postal debe contener solo números";
    return "";
  },
};

// ================================
// VALIDACIÓN COMPLETA
// ================================

export const validateAllFields = (
  data: Partial<CreateClientData>
): ClientFormErrors => {
  return {
    nombre: fieldValidators.nombre(data.nombre ?? ""),
    apellido: fieldValidators.apellido(data.apellido ?? ""),
    tipo: fieldValidators.tipo(data.tipo ?? 0),
    documento: fieldValidators.documento(data.documento ?? ""),
    telefono: fieldValidators.telefono(data.telefono ?? ""),
    correoElectronico: fieldValidators.correoElectronico(
      data.correoElectronico ?? ""
    ),
    estado: fieldValidators.estado(data.estado ?? ""),
    ciudad: fieldValidators.ciudad(data.ciudad ?? ""),
    codigoPostal: fieldValidators.codigoPostal(
      data.codigoPostal ?? ""
    ),
  };
};

// ================================
// VALIDACIÓN CON NOTIFICACIÓN GLOBAL
// ================================

export const validateFormWithNotification = (
  data: Partial<CreateClientData>,
  setErrors: Dispatch<SetStateAction<ClientFormErrors>>,
  setTouched: Dispatch<SetStateAction<ClientFormTouched>>
): boolean => {
  const errors = validateAllFields(data);

  setErrors(errors);

  setTouched({
    nombre: true,
    apellido: true,
    tipo: true,
    documento: true,
    telefono: true,
    correoElectronico: true,
    estado: true,
    ciudad: true,
    codigoPostal: true,
  });

  const firstError = Object.values(errors).find((x) => x);

  if (firstError) {
    showWarning(firstError);
    return false;
  }

  return true;
};

// ================================
// VALIDACIÓN DE UN SOLO CAMPO
// ================================

export const validateSingleField = <K extends FieldKey>(
  field: K,
  value: string | number,
  setErrors: Dispatch<SetStateAction<ClientFormErrors>>,
  setTouched: Dispatch<SetStateAction<ClientFormTouched>>
) => {
  const validator = fieldValidators[field];
  const error = validator(value);

  setErrors((prev) => ({ ...prev, [field]: error }));
  setTouched((prev) => ({ ...prev, [field]: true }));

  if (error) showWarning(error);
};