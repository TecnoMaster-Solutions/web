import { toast, ToastOptions, Id } from "react-toastify";

export const APP_TOAST_ID = "app";

const defaultToastOptions: ToastOptions = {
  containerId: APP_TOAST_ID,
  position: "bottom-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

const mergeOptions = (options?: ToastOptions): ToastOptions => {
  return {
    ...defaultToastOptions,
    ...(options || {}),
    containerId: options?.containerId ?? APP_TOAST_ID,
  };
};

export const showSuccess = (message: string, options?: ToastOptions): Id =>
  toast.success(message, mergeOptions(options));

export const showError = (message: string, options?: ToastOptions): Id =>
  toast.error(message, mergeOptions(options));

export const showWarning = (message: string, options?: ToastOptions): Id =>
  toast.warning(message, mergeOptions(options));

export const showInfo = (message: string, options?: ToastOptions): Id =>
  toast.info(message, mergeOptions(options));

export const dismissToast = (id?: Id) => {
  if (id) toast.dismiss(id);
  else toast.dismiss();
};
