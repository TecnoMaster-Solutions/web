"use client";

import { api } from "@/shared/utils/apiClient";

// ==============================
// TYPES
// ==============================

export interface PurchaseOrderFromApi {
  id: number;
  numeroOrden: string;
  proveedor: string;
  precioUnitario: number | string;
  fecha: string;

  estado: string;
  descripcion?: string | null;
  cantidad: number;

  subtotal: number | string;
  iva: number | string;
  total: number | string;

  motivoAnulacion?: string | null;
  fechaAnulacion?: string | null;
  usuarioAnulacion?: string | null;

  productos?: {
    producto: string;
    cantidad: number;
    precioUnitario: number | string;
  }[] | null;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplier: string;

  unitPrice: number;
  date: string;
  state: string;

  description: string | null;
  quantity: number;

  subtotal: number;
  iva: number;
  total: number;

  cancelReason?: string | null;
  cancelDate?: string | null;
  cancelUser?: string | null;

  products: {
    producto: string;
    cantidad: number;
    precioUnitario: number;
  }[];
}

// ==============================
// UTILS
// ==============================

const toNumber = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const calculateTotals = (
  cantidad: number,
  precioUnitario: number,
  productos?: {
    producto: string;
    cantidad: number;
    precioUnitario: number;
  }[]
) => {
  let subtotal = 0;

  const hasProducts = productos && productos.length > 0;

  if (hasProducts) {
    subtotal = productos.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0
    );
  } else {
    subtotal = cantidad * precioUnitario;
  }

  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return { subtotal, iva, total };
};

const toUi = (p: PurchaseOrderFromApi): PurchaseOrder => {
  const unitPrice = toNumber(p.precioUnitario);

  const products =
    p.productos?.map((item) => ({
      producto: item.producto,
      cantidad: item.cantidad,
      precioUnitario: toNumber(item.precioUnitario),
    })) ?? [];

  const { subtotal, iva, total } = calculateTotals(
    p.cantidad,
    unitPrice,
    products
  );

  return {
    id: p.id,
    orderNumber: p.numeroOrden,
    supplier: p.proveedor,

    unitPrice,
    date: p.fecha,
    state: p.estado,

    description: p.descripcion ?? null,
    quantity: p.cantidad,

    subtotal,
    iva,
    total,

    cancelReason: p.motivoAnulacion ?? null,
    cancelDate: p.fechaAnulacion ?? null,
    cancelUser: p.usuarioAnulacion ?? null,

    products,
  };
};

// ==============================
// API METHODS
// ==============================

const BASE = "/purchase-orders";

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const { data } = await api.get<PurchaseOrderFromApi[]>(BASE);
  return data.map(toUi);
};

export const getPurchaseOrderById = async (
  id: number
): Promise<PurchaseOrder> => {
  const { data } = await api.get<PurchaseOrderFromApi>(`${BASE}/${id}`);
  return toUi(data);
};

export const createPurchaseOrder = async (
  payload: any
): Promise<PurchaseOrder> => {
  const { data } = await api.post<PurchaseOrderFromApi>(BASE, payload);
  return toUi(data);
};

export const updatePurchaseOrder = async (
  id: number,
  payload: any
): Promise<PurchaseOrder> => {
  const { data } = await api.patch<PurchaseOrderFromApi>(
    `${BASE}/${id}`,
    payload
  );
  return toUi(data);
};

export const deletePurchaseOrder = async (
  id: number
): Promise<boolean> => {
  await api.delete(`${BASE}/${id}`);
  return true;
};

export const cancelPurchaseOrder = async (
  id: number,
  reason: string,
  user: string
): Promise<PurchaseOrder> => {
  const body = {
    estado: "Anulada",
    motivoAnulacion: reason,
    fechaAnulacion: new Date().toISOString(),
    usuarioAnulacion: user,
  };

  const { data } = await api.patch<PurchaseOrderFromApi>(
    `${BASE}/${id}/cancel`,
    body
  );

  return toUi(data);
};