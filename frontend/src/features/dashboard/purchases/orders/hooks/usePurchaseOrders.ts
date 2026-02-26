import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPurchaseOrderData,
  createPurchaseOrderModalProps,
  formErrors,
  formTouched,
  purchaseOrder,
  PurchaseOrderItem
} from "../types/typesPurchaseOrder";
import { showSuccess, showError, showWarning } from "@/shared/utils/notifications";
import {
  validateField,
  validateFormWithNotification
} from "../Validations/UserValidations";
import {
  getPurchaseOrdersFromAPI,
  createPurchaseOrderInDB,
  generateOrderNumber,
} from "../services/suppliersOrderService";

/* ============================= */
/* Hook PRINCIPAL ORDENES        */
/* ============================= */

export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<purchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPurchaseOrder, setViewingPurchaseOrder] =
    useState<purchaseOrder | null>(null);

  // ── Cargar órdenes desde el backend ────────────────────────────────────────
  const loadPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPurchaseOrdersFromAPI();
      console.log("Purchase orders loaded in hook:", data.length);
      setPurchaseOrders(data);
    } catch (error) {
      console.error("Hook load error:", error);
      showError("Error al cargar las órdenes de compra.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  // ── Crear orden en el backend ──────────────────────────────────────────────
  const handleCreatePurchaseOrder = async (
    purchaseOrderData: createPurchaseOrderData & { proveedorId?: number }
  ) => {
    const subtotal = purchaseOrderData.items.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0
    );
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    try {
      await createPurchaseOrderInDB({
        numeroOrden: generateOrderNumber(),
        proveedorId: purchaseOrderData.proveedorId ?? 0,
        fecha: purchaseOrderData.fecha,
        items: purchaseOrderData.items,
        total,
        subtotal,
        iva,
        descripcion: purchaseOrderData.descripcion,
      });

      showSuccess("Orden de compra guardada exitosamente.");
      setIsCreateModalOpen(false);
      // Recargar lista
      await loadPurchaseOrders();
    } catch {
      showError("Error al guardar la orden de compra.");
    }
  };

  const handleView = (purchaseOrder: purchaseOrder) => {
    setViewingPurchaseOrder(purchaseOrder);
  };

  const closeModals = () => {
    setViewingPurchaseOrder(null);
    setIsCreateModalOpen(false);
  };

  return {
    purchaseOrders,
    loading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    viewingPurchaseOrder,
    handleCreatePurchaseOrder,
    handleView,
    closeModals,
  };
};


/* ============================= */
/* Hook CREAR ORDEN DE COMPRA */
/* ============================= */

type HeaderFields = "proveedor" | "fecha" | "descripcion";

export const useCreatePurchaseOrderForm = ({
  isOpen,
  onClose,
  onSave
}: createPurchaseOrderModalProps) => {
  const [formData, setFormData] = useState<createPurchaseOrderData>({
    proveedor: "",
    proveedorId: 0,
    fecha: "",
    descripcion: "",
    items: [{ producto: "", cantidad: 1, precioUnitario: 0 }]
  });

  const [errors, setErrors] = useState<formErrors>({
    proveedor: "",
    fecha: "",
    descripcion: ""
  });

  const [touched, setTouched] = useState<formTouched>({
    proveedor: false,
    fecha: false,
    descripcion: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ============================= */
  /* TOTAL DINÁMICO */
  /* ============================= */

  const calculatedTotal = useMemo(() => {
    return formData.items.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0
    );
  }, [formData.items]);

  /* ============================= */
  /* HANDLERS HEADER */
  /* ============================= */

  const handleInputChange = (field: HeaderFields, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (touched[field]) {
      const error = validateField(field, value, newFormData, false);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: HeaderFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const value = formData[field];

    const error = validateField(field, value, formData, false);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSupplierChange = (name: string, id: number) => {
    const newFormData = { ...formData, proveedor: name, proveedorId: id };
    setFormData(newFormData);

    if (touched.proveedor) {
      const error = validateField("proveedor", name, newFormData, false);
      setErrors((prev) => ({ ...prev, proveedor: error }));
    }
  };

  /* ============================= */
  /* HANDLERS ITEMS */
  /* ============================= */

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { producto: "", cantidad: 1, precioUnitario: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseOrderItem,
    value: string | number
  ) => {
    const newItems = [...formData.items];

    newItems[index] = {
      ...newItems[index],
      [field]:
        field === "cantidad" || field === "precioUnitario"
          ? Number(value)
          : value
    };

    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  /* ============================= */
  /* VALIDACIONES */
  /* ============================= */

  const validateItems = (): boolean => {
    if (formData.items.length === 0) {
      showWarning("Debe agregar al menos un producto.");
      return false;
    }

    for (const item of formData.items) {
      if (!item.producto.trim()) {
        showWarning("Todos los productos deben tener nombre.");
        return false;
      }

      if (item.cantidad <= 0) {
        showWarning("La cantidad debe ser mayor a 0.");
        return false;
      }

      if (item.precioUnitario < 0) {
        showWarning("El precio no puede ser negativo.");
        return false;
      }
    }

    if (calculatedTotal <= 0) {
      showWarning("El total debe ser mayor a 0.");
      return false;
    }

    return true;
  };

  const validateFormWithNotifications = (): boolean => {
    const headerValid = validateFormWithNotification(
      formData,
      setErrors,
      setTouched
    );

    const itemsValid = validateItems();

    return headerValid && itemsValid;
  };

  /* ============================= */
  /* SUBMIT */
  /* ============================= */

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateFormWithNotifications()) return;

    setIsSubmitting(true);

    try {
      onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error al guardar orden:", error);
      showWarning("Error al guardar la orden de compra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ============================= */
  /* RESET AL ABRIR MODAL */
  /* ============================= */

  useEffect(() => {
    if (isOpen) {
      setFormData({
        proveedor: "",
        proveedorId: 0,
        fecha: "",
        descripcion: "",
        items: [{ producto: "", cantidad: 1, precioUnitario: 0 }]
      });

      setErrors({
        proveedor: "",
        fecha: "",
        descripcion: ""
      });

      setTouched({
        proveedor: false,
        fecha: false,
        descripcion: false
      });

      setIsSubmitting(false);
    }
  }, [isOpen]);

  /** Reemplaza todos los items directamente (útil para cargar productos del proveedor) */
  const setItems = useCallback(
    (items: PurchaseOrderItem[]) =>
      setFormData((prev) => ({ ...prev, items })),
    []
  );

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    calculatedTotal,
    handleInputChange,
    handleSupplierChange,
    handleBlur,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleSubmit,
    setItems,
  };
};

