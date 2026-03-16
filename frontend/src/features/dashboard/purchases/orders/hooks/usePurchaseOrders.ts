import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPurchaseOrderData,
  createPurchaseOrderModalProps,
  formErrors,
  formTouched,
  purchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderFormErrors
} from "../types/typesPurchaseOrder";
import { showSuccess, showError, showWarning } from "@/shared/utils/notifications";
import {
  validateField,
  validateFormWithNotification
} from "../Validations/UserValidations";
import {
  getPurchaseOrdersFromAPI,
  createPurchaseOrderInDB,
  PurchaseOrderAPIResponse,
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
  ): Promise<PurchaseOrderAPIResponse | null> => {
    if (!purchaseOrderData.proveedorId) {
      showError("Proveedor inválido.");
      return null;
    }

    if (purchaseOrderData.items.length === 0) {
      showError("Debe agregar al menos un producto.");
      return null;
    }

    // Filtrar items válidos (con cantidad > 0)
    // Ahora permitimos productos sin productId (entrada manual)
    const validItems = purchaseOrderData.items.filter(
      (item) => item.cantidad > 0 && item.producto.trim()
    );

    if (validItems.length === 0) {
      showError("Debe agregar productos válidos con cantidad mayor a 0.");
      return null;
    }

    // Verificar si hay productos sin ID (entrada manual)
    const itemsWithoutId = validItems.filter((item) => !item.productoId);
    if (itemsWithoutId.length > 0) {
      showWarning(`${itemsWithoutId.length} producto(s) se guardarán como entrada manual sin vinculación a la base de datos.`);
    }

    try {
      const result = await createPurchaseOrderInDB({
        proveedorId: purchaseOrderData.proveedorId,
        fechaEntregaEstimada: purchaseOrderData.fecha,
        observaciones: purchaseOrderData.descripcion,
        detalles: validItems.map((item) => ({
          productoId: item.productoId ?? null, // Enviar null si es entrada manual
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          // Incluir nombre del producto para entradas manuales
          productoNombre: item.producto,
        })),
      });
      showSuccess("Orden de compra guardada exitosamente.");
      setIsCreateModalOpen(false);
      await loadPurchaseOrders();
      return result;
    } catch (error) {
      console.error("Create order error:", error);
      showError("Error al guardar la orden de compra.");
      return null;
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

  const [formErrors, setFormErrors] = useState<PurchaseOrderFormErrors>({});

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

  const validatePurchaseOrderForm = (
    supplierId: number | null,
    items: PurchaseOrderItem[]
  ): PurchaseOrderFormErrors => {
    const errors: PurchaseOrderFormErrors = {};

    if (!supplierId || supplierId <= 0) {
      errors.supplierId = 'Debe seleccionar un proveedor';
    }

    if (!items || items.length === 0) {
      errors.items = 'La orden debe tener al menos un producto';
      return errors;
    }

    const itemErrors = items.map(item => {
      const err: { productId?: string; quantity?: string; unitPrice?: string } = {};
      if (!item.productoId) err.productId = 'Seleccione un producto';
      if (!item.cantidad || item.cantidad < 1) err.quantity = 'La cantidad mínima es 1';
      if (!item.precioUnitario || item.precioUnitario <= 0) err.unitPrice = 'El precio debe ser mayor a 0';
      return err;
    });

    const hasItemErrors = itemErrors.some(e => Object.keys(e).length > 0);
    if (hasItemErrors) errors.itemErrors = itemErrors;

    return errors;
  };

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

      // Validar que tenga productoId (seleccionado de la lista) O que sea entrada manual
      // Si es entrada manual sin productId, permitirlo pero con advertencia
      if (!item.productoId) {
        console.warn("Producto sin ID de base de datos - se guardará como entrada manual");
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
  /* SUBMIT - Now returns Promise for async handling */
  /* ============================= */

  const handleSubmit = async (e?: React.FormEvent): Promise<PurchaseOrderAPIResponse | null> => {
    e?.preventDefault();

    // Validar formulario antes de enviar
    const errors = validatePurchaseOrderForm(formData.proveedorId, formData.items);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showWarning('Por favor complete los campos correctamente');
      return null;
    }

    if (!validateFormWithNotifications()) return null;

    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
      // Return null since onSave doesn't return anything, but we need the promise
      return null;
    } catch (error) {
      console.error("Error al guardar orden:", error);
      showWarning("Error al guardar la orden de compra.");
      return null;
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

      setFormErrors({});

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
    formErrors,
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

