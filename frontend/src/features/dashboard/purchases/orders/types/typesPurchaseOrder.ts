import { ReactNode } from "react";

/* ============================= */
/* ITEM DE ORDEN */
/* ============================= */

export interface PurchaseOrderItem {
  imagen?: string; // URL o base64 si luego manejas preview
  producto: string;
  productoId?: number; // ID del producto desde product_supplier
  cantidad: number;
  precioUnitario: number;
}

/* ============================= */
/* STATE RELATION */
/* ============================= */

export interface PurchaseOrderState {
  stateid: number;
  statename: string;
  statecode?: string;
}

/* ============================= */
/* MODELO PRINCIPAL (BACKEND) */
/* ============================= */

export interface purchaseOrder {
  id: number;
  numeroOrden: string; // Generado por backend
  proveedor: string;
  proveedorId?: number;
  fecha: string;
  fechaEntrega?: string; // Nueva fecha estimada de entrega
  estado: string;
  state?: PurchaseOrderState; // Relación con la tabla states
  descripcion?: string;
  items: PurchaseOrderItem[];
  total: number;
}

/* ============================= */
/* CREACIÓN */
/* ============================= */

export interface createPurchaseOrderData {
  proveedor: string; // Nombre
  proveedorId: number; // ID para la DB
  fecha: string;
  descripcion?: string;
  items: PurchaseOrderItem[];
  // Datos del proveedor para notificación
  supplierEmail?: string;
  supplierName?: string;
  supplierPhone?: string;
}

/* ============================= */
/* ERRORES DE FORMULARIO */
/* ============================= */

export interface formErrors {
  proveedor: string;
  fecha: string;
  descripcion: string;
}

/* ============================= */
/* TOUCHED DE FORMULARIO */
/* ============================= */

export interface formTouched {
  proveedor: boolean;
  fecha: boolean;
  descripcion: boolean;
}

/* ============================= */
/* PROPS MODAL CREAR */
/* ============================= */

export interface createPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (purchaseOrderData: createPurchaseOrderData) => void;
}

/* ============================= */
/* PROPS MODAL VER */
/* ============================= */

export interface viewPurchaseOrderModalProps {
  isOpen: boolean;
  purchaseOrder: purchaseOrder | null;
  onClose: () => void;
}

/* ============================= */
/* PROPS TABLA */
/* ============================= */

export interface PurchaseOrdersTableProps {
  purchaseOrders: purchaseOrder[];
  onView: (purchaseOrder: purchaseOrder) => void;
  onCreate: () => void;
  rightActions?: ReactNode;
}

/* ============================= */
/* PARA TABLA */
/* ============================= */

export interface purchaseOrderForTable
  extends Omit<purchaseOrder, "id"> {
  id: number;
  /** Campo auxiliar de texto plano para búsqueda en DataTable */
  searchQuery?: string;
}

/* ============================= */
/* ERRORES DE VALIDACIÓN FORMULARIO */
/* ============================= */

export interface PurchaseOrderItemError {
  productId?: string;
  quantity?: string;
  unitPrice?: string;
}

export interface PurchaseOrderFormErrors {
  supplierId?: string;
  items?: string;
  itemErrors?: PurchaseOrderItemError[];
}