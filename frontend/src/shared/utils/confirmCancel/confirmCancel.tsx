// components/ConfirmDialog/ConfirmDialog.tsx
import React from 'react';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { showSuccess, showError } from "../notifications";

const MySwal = withReactContent(Swal);

export interface ConfirmDialogOptions {
  title: string;
  text: string;
  itemName: string;
  inputLabel: string;
  inputPlaceholder: string;
  confirmButtonText: string;
  cancelButtonText: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  icon?: "warning" | "info" | "error" | "success" | "question";
  inputValidator?: (value: string) => string | null;
}

export const confirmAction = async (
  options: ConfirmDialogOptions,
  onConfirm: (reason: string) => Promise<void> | void
): Promise<boolean> => {
  const { 
    title, 
    text, 
    inputLabel, 
    inputPlaceholder, 
    confirmButtonText, 
    cancelButtonText,
    confirmButtonColor = "#d33",
    cancelButtonColor = "#3085d6",
    icon = "warning",
    inputValidator,
    itemName
  } = options;

  const { value: reason, isConfirmed } = await MySwal.fire({
    title,
    text,
    icon,
    input: "textarea",
    inputLabel,
    inputPlaceholder,
    inputAttributes: {
      "aria-label": inputPlaceholder
    },
    inputValidator: inputValidator || ((value) => {
      if (!value) {
        return "Debes ingresar un motivo.";
      }
      return null;
    }),
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor,
    cancelButtonColor,
    reverseButtons: true,
    customClass: {
      confirmButton: "swal2-confirm",
      cancelButton: "swal2-cancel"
    }
  });

  if (isConfirmed && reason) {
    try {
      await onConfirm(reason);
      showSuccess(`"${itemName}" ha sido procesado correctamente.`);
      return true;
    } catch (error) {
      showError(`No se pudo completar la acción para "${itemName}". Intenta nuevamente.`);
      return false;
    }
  }

  return false;
};

// Ejemplo de uso específico para cancelación de citas
export const confirmCancelAppointment = (
  itemName: string,
  onConfirm: (reason: string) => Promise<void> | void
): Promise<boolean> => {
  return confirmAction({
    title: "Cancelar cita",
    text: `¿Deseas cancelar la cita "${itemName}"? Debes indicar el motivo.`,
    itemName,
    inputLabel: "Motivo de cancelación",
    inputPlaceholder: "Escribe el motivo aquí...",
    confirmButtonText: "Sí, cancelar cita",
    cancelButtonText: "Volver",
    icon: "warning"
  }, onConfirm);
};

// Ejemplo de uso para eliminar usuario
export const confirmDeleteUser = (
  itemName: string,
  onConfirm: (reason: string) => Promise<void> | void
): Promise<boolean> => {
  return confirmAction({
    title: "Eliminar usuario",
    text: `¿Estás seguro de eliminar al usuario "${itemName}"? Por favor, indica el motivo.`,
    itemName,
    inputLabel: "Motivo de eliminación",
    inputPlaceholder: "Escribe el motivo aquí...",
    confirmButtonText: "Sí, eliminar usuario",
    cancelButtonText: "Cancelar",
    icon: "warning"
  }, onConfirm);
};