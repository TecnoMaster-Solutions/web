export interface ConfirmDeleteOptions {
  itemName: string;
  itemType?: string;
  customMessage?: string;
  successMessage?: string;
  errorMessage?: string;

  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  skipSuccessToast?: boolean;

  showConfirmButton?: boolean;
  showCancelButton?: boolean;  
}
