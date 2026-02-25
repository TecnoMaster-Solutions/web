import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { showSuccess } from "../notifications";
import { ConfirmDeleteOptions } from "./typeConfirmDelete";

const MySwal = withReactContent(Swal);

export const confirmDelete = async (
  options: ConfirmDeleteOptions,
  onConfirm: () => Promise<void> | void
): Promise<boolean> => {
  const {
    itemName,
    itemType = "elemento",
    customMessage,
    successMessage,
    errorMessage,
    title,
    confirmButtonText,
    cancelButtonText,
    skipSuccessToast,

    showConfirmButton,
    showCancelButton,
  } = options;

  const finalShowConfirm = showConfirmButton ?? true;
  const finalShowCancel = showCancelButton ?? true;

  const result = await MySwal.fire({
    title: title ?? "¿Estás seguro?",
    text: customMessage || `¿Deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`,
    icon: "warning",

    showConfirmButton: finalShowConfirm,
    showCancelButton: finalShowCancel,

    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",

    confirmButtonText: confirmButtonText ?? "Sí, eliminar",
    cancelButtonText: cancelButtonText ?? (finalShowConfirm ? "Cancelar" : "Cerrar"),

    reverseButtons: true,
    customClass: {
      confirmButton: "swal2-confirm",
      cancelButton: "swal2-cancel",
    },
  });

  if (!result.isConfirmed) return false;

  try {
    await onConfirm();
    if (!skipSuccessToast) {
      showSuccess(successMessage || `${itemType} "${itemName}" ha sido eliminado correctamente.`);
    }
    return true;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : errorMessage ??
          `No se pudo eliminar el ${itemType}. Por favor, intenta nuevamente.`;
    await MySwal.fire({
      title: "Error",
      text: message,
      icon: "error",
    });
    return false;
  }
};

export const confirmDeleteSimple = async (
  itemName: string,
  onConfirm: () => Promise<void> | void,
  itemType: string = "elemento"
): Promise<boolean> => confirmDelete({ itemName, itemType }, onConfirm);
