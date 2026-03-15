import type { IPurchase } from "@/features/dashboard/purchases/Types/Purchase.type";

export type PurchaseFormField =
  | "orderNumber"
  | "invoiceNumber"
  | "supplier"
  | "registerDate"
  | "description"
  | "amount"
  | "products"
  | "purchaseOrderId"
  | "purchaseOrderFinalStateId";

export type PurchaseErrors = Partial<Record<PurchaseFormField, string>>;

type Draft = {
  orderNumber: string;
  invoiceNumber: string;
  supplier: string;
  registerDate: string;
  description: string;
  amount: number;
  productsCount: number;

  purchaseOrderId?: string;
  purchaseOrderFinalStateId?: string;
};

const normalize = (v: unknown) => String(v ?? "").trim();
const getPurchaseId = (purchase: IPurchase) => purchase.purchaseorderid;
const getPurchaseOrderNumber = (purchase: IPurchase) =>
  normalize(purchase.numberoforder);
const getPurchaseInvoiceNumber = (purchase: IPurchase) =>
  normalize(purchase.reference);

export const validatePurchaseField = (
  field: PurchaseFormField,
  value: unknown,
  purchases: IPurchase[] = [],
  currentId?: number,
  draft?: Draft
): string | undefined => {
  switch (field) {
    case "orderNumber": {
      const order = normalize(value);
      if (!order) return "El número de orden es obligatorio";

      const duplicated = (purchases ?? []).some((p) => {
        const currentOrder = getPurchaseOrderNumber(p);
        const pid = getPurchaseId(p);
        return (
          currentOrder.toLowerCase() === order.toLowerCase() && pid !== currentId
        );
      });

      if (duplicated) return "Ya existe una compra con este número de orden";
      return;
    }

    case "invoiceNumber": {
      const invoice = normalize(value);
      if (!invoice) return "El número de factura es obligatorio";

      const duplicated = (purchases ?? []).some((p) => {
        const currentInvoice = getPurchaseInvoiceNumber(p);
        const pid = getPurchaseId(p);
        return (
          currentInvoice.toLowerCase() === invoice.toLowerCase() &&
          pid !== currentId
        );
      });

      if (duplicated) return "Ya existe una compra con este número de factura";
      return;
    }

    case "supplier": {
      const v = normalize(value);
      if (!v) return "El proveedor es obligatorio";
      if (Number.isNaN(Number(v)) || Number(v) <= 0) return "Proveedor inválido";
      return;
    }

    case "registerDate": {
      const v = normalize(value);
      if (!v) return "La fecha de registro es obligatoria";

      const today = new Date();
      const todayYMD = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).getTime();

      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "Fecha inválida";

      const dYMD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (dYMD > todayYMD) return "La fecha de registro no puede ser futura";
      return;
    }

    case "description": {
      const v = normalize(value);
      if (!v) return;
      if (v.length < 3) return "Escribe una observación más clara";
      return;
    }

    case "amount": {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) return "El monto debe ser mayor que 0";
      return;
    }

    case "products": {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0)
        return "Debes agregar al menos un producto al carrito";
      return;
    }

    case "purchaseOrderId":
      return;

    case "purchaseOrderFinalStateId": {
      const poId = normalize(draft?.purchaseOrderId);
      const v = normalize(value);

      if (!poId) return;

      if (!v) return "Debes seleccionar el estado final de la Orden de Compra";
      const n = Number(v);
      if (![6, 8].includes(n)) return "Estado final inválido (solo 6 o 8)";
      return;
    }

    default:
      return;
  }
};

export const validatePurchaseForm = (
  data: Draft,
  purchases: IPurchase[] = [],
  currentId?: number
): PurchaseErrors => {
  const errors: PurchaseErrors = {};

  const fields: PurchaseFormField[] = [
    "registerDate",
    "orderNumber",
    "invoiceNumber",
    "supplier",
    "amount",
    "products",
    "purchaseOrderId",
    "purchaseOrderFinalStateId",
  ];

  for (const f of fields) {
    const value =
      f === "products" ? data.productsCount : data[f as keyof Draft];
    const err = validatePurchaseField(f, value, purchases, currentId, data);
    if (err) errors[f] = err;
  }

  return errors;
};
