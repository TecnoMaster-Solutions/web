import { apiClient } from "@/shared/utils/apiClient";
import { PurchaseOrderItem, purchaseOrder } from "../types/typesPurchaseOrder";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ProductoAPI {
    productid: number;
    productname: string;
    productpriceofsupplier: number;
    productstock: number;
    image?: string;
    productdescription?: string | null;
}

export interface SendNotificationPayload {
    numeroOrden: string;
    proveedorId: number;
    supplierName: string;
    supplierEmail?: string;
    supplierPhone?: string;
    productos: PurchaseOrderItem[];
    total: number;
    fecha?: string;
    descripcion?: string;
}

export interface NotificationResult {
    success: boolean;
    channel: "whatsapp" | "email" | "both";
    payload: object;
}

// ─── Tipo de respuesta del backend de PO ──────────────────────────────────────
export interface PurchaseOrderAPIResponse {
    id: number;
    numeroorden: string;
    proveedorid: number;
    estadoid: number;
    supplier?: { name: string; supplierid: number };
    state?: { name: string };
    fecha: string;
    preciounitario: number;
    cantidad: number;
    subtotal: number;
    iva: number;
    total: number;
    descripcion?: string | null;
    createat: string;
}

// ─── Obtener productos de un proveedor existente ───────────────────────────────
export async function getProductsBySupplier(
    supplierId: number
): Promise<ProductoAPI[]> {
    try {
        const result = await apiClient.get<ProductoAPI[]>(
            `/purchase-orders/by-supplier/${supplierId}`
        );
        return Array.isArray(result) ? result : [];
    } catch {
        return [];
    }
}

// ─── Obtener todas las órdenes de compra desde el backend ─────────────────────
export async function getPurchaseOrdersFromAPI(): Promise<purchaseOrder[]> {
    try {
        const result = await apiClient.get<PurchaseOrderAPIResponse[]>("/purchase-orders");
        const rows = Array.isArray(result) ? result : [];

        const mapped = rows.map((po) => {
            // items guardados en JSON dentro de descripcion (si existe)
            let items: PurchaseOrderItem[] = [];
            try {
                const parsed = JSON.parse(po.descripcion ?? "");
                if (Array.isArray(parsed?.items)) {
                    items = parsed.items;
                }
            } catch {
                // Sin items serializados — crear uno desde los campos del registro
                items = [{
                    producto: "(sin nombre)",
                    cantidad: po.cantidad,
                    precioUnitario: Number(po.preciounitario),
                }];
            }

            console.log("Mapped PO:", po.numeroorden, "Items:", items.length);

            return {
                id: po.id,
                numeroOrden: po.numeroorden,
                proveedor: po.supplier?.name ?? `Proveedor #${po.proveedorid}`,
                fecha: po.fecha,
                estado: "Pendiente" as const,
                descripcion: po.descripcion ?? undefined,
                items,
                total: Number(po.total),
            };
        });

        console.log("Total mapped orders:", mapped.length);
        return mapped;
    } catch (error) {
        return [];
    }
}

// ─── Crear orden de compra en el backend ──────────────────────────────────────
export interface CreatePOPayload {
    numeroOrden: string;
    proveedorId: number;
    fecha: string;
    items: PurchaseOrderItem[];
    total: number;
    subtotal: number;
    iva: number;
    descripcion?: string;
}

export async function createPurchaseOrderInDB(
    payload: CreatePOPayload
): Promise<PurchaseOrderAPIResponse> {
    // El backend acepta un registro con un item; usamos el mayor item como el "principal"
    // El resto de items queda serializado en JSON dentro del campo descripcion
    const firstItem = payload.items[0] ?? { producto: "", cantidad: 1, precioUnitario: 0 };

    const descripcionPayload = JSON.stringify({
        items: payload.items,
        observacion: payload.descripcion,
    });

    const body = {
        numeroOrden: payload.numeroOrden,
        proveedorId: payload.proveedorId,
        fecha: payload.fecha,
        precioUnitario: Number(firstItem.precioUnitario),
        cantidad: Number(firstItem.cantidad),
        descripcion: descripcionPayload,
    };

    const result = await apiClient.post<PurchaseOrderAPIResponse>(
        "/purchase-orders",
        body
    );
    return result;
}

// ─── Generar número de orden automático (frontend) ────────────────────────────
export function generateOrderNumber(): string {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
    return `OC-${ts}-${rand}`;
}

// ─── Enviar notificación al proveedor (WhatsApp / Email) ─────────────────────
export async function sendPurchaseOrderNotification(
    payload: SendNotificationPayload
): Promise<NotificationResult> {
    const result = await apiClient.post<NotificationResult>(
        "/purchase-orders/send-notification",
        payload
    );
    return result;
}
