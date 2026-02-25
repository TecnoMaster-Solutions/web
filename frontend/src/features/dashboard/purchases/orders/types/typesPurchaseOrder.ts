import { ReactNode } from "react";

/* ============================= */
/* ITEM DE ORDEN */
/* ============================= */

export interface PurchaseOrderItem {
  imagen?: string; // URL o base64 si luego manejas preview
  producto: string;
  cantidad: number;
  precioUnitario: number;
}

/* ============================= */
/* MODELO PRINCIPAL (BACKEND) */
/* ============================= */

export interface purchaseOrder {
  id: number;
  numeroOrden: string; // Generado por backend
  proveedor: string;
  fecha: string;
  estado: "Pendiente";
  descripcion?: string;
  items: PurchaseOrderItem[];
  total: number;

  // Solo para visualización si luego lo necesitas
  fechaCreacion?: ReactNode;
  monto?: string;
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