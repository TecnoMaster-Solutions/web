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
    numeroOrden: string;
    proveedorid: number;
    estadoid: number;
    supplier?: { name: string; supplierid: number };
    state?: { name: string };
    fechaCreacion?: string;
    createat?: string;
    fecha?: string;
    fechaEstimadaEntrega?: string;
    preciounitario?: number;
    cantidad?: number;
    subtotal: number;
    iva: number;
    total: number;
    descripcion?: string | null;
    observaciones?: string | null; // Campo de observación
    detalles?: Array<{
        id: number;
        ordenCompraId: number;
        productoId: number;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
        producto?: {
            productid: number;
            productname: string;
            image?: string;
        };
        productoNombre?: string;
    }>;
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
            // Los items ahora vienen en la relación 'detalles' desde el backend
            let items: PurchaseOrderItem[] = [];
            
            // Si hay detalles desde el backend, usarlos
            if (po.detalles && Array.isArray(po.detalles) && po.detalles.length > 0) {
                items = po.detalles.map((detalle: any) => ({
                    producto: detalle.producto?.productname ?? detalle.productoNombre ?? "(sin nombre)",
                    productoId: detalle.productoId,
                    cantidad: Number(detalle.cantidad),
                    precioUnitario: Number(detalle.precioUnitario),
                    imagen: detalle.producto?.image,
                }));
            } else {
                // Fallback: intentar leer desde JSON en descripción (formato antiguo)
                try {
                    const parsed = JSON.parse(po.descripcion ?? "");
                    if (Array.isArray(parsed?.items)) {
                        items = parsed.items;
                    }
                } catch {
                    // Sin items - crear uno vacío
                    items = [];
                }
            }

            // Mapear fecha de entrega correctamente
            const fechaEntrega = po.fechaEstimadaEntrega || undefined;

            return {
                id: po.id,
                numeroOrden: po.numeroOrden,
                proveedor: po.supplier?.name ?? `Proveedor #${po.proveedorid}`,
                fecha: po.fechaCreacion || po.createat || po.fecha || "",
                fechaEntrega: fechaEntrega,
                estado: po.state?.name ?? "Pendiente",
                // Soportar tanto 'descripcion' como 'observaciones' del backend
                descripcion: po.descripcion ?? po.observaciones ?? undefined,
                items,
                total: Number(po.total),
            };
        });

        return mapped;
    } catch (error) {
        console.error("Error fetching purchase orders:", error);
        return [];
    }
}

// ─── Crear orden de compra en el backend ──────────────────────────────────────
export interface CreatePOPayload {
    proveedorId: number;
    fechaEntregaEstimada: string;
    observaciones?: string;
    detalles: Array<{
        productoId: number | null; // Permite null para entradas manuales
        cantidad: number;
        precioUnitario: number;
        productoNombre?: string; // Para entradas manuales sin productId
    }>;
}

export async function createPurchaseOrderInDB(
    payload: CreatePOPayload
): Promise<PurchaseOrderAPIResponse> {

    const body = {
        proveedorId: payload.proveedorId,
        estadoId: 5, // 5 = Pendiente (según tabla states de la base de datos)
        fechaEstimadaEntrega: payload.fechaEntregaEstimada,
        detalles: payload.detalles.map((item) => ({
            productoId: item.productoId ?? null, // Enviar null si es entrada manual
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
            productoNombre: item.productoNombre ?? null,
        })),
        observaciones: payload.observaciones ?? null,
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
    // Determinar la URL base
    let baseURL = "";
    
    // Verificar si estamos en el navegador (client-side)
    if (typeof window !== "undefined" && window.location) {
        baseURL = window.location.origin;
    } else {
        // En servidor, usar variable de entorno o URL por defecto
        baseURL =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://vertecx-api-sha-09ac69f.onrender.com";
    }
    
    // Determinar si usamos el API route de Next.js o el backend externo
    // Si la URL base contiene :3000, estamos en el frontend de Next.js y usamos el API route interno
    // Si la URL base contiene :3001, usamos el backend externo
    const isNextJS = baseURL.includes(":3000");
    
    // Intentar primero con el endpoint del API route de Next.js
    let url = `${baseURL}/api/purchase-orders/send-notification`;
    
    console.log("Notification URL (primary):", url);
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        
        if (response.ok) {
            const result = await response.json();
            return result;
        }
        
        // Si falla con 404, intentar con el backend externo
        if (response.status === 404) {
            console.log("Primary URL failed, trying external backend...");
            url = `${baseURL}/purchase-orders/send-notification`;
            console.log("Notification URL (fallback):", url);
            
            const fallbackResponse = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            
            if (fallbackResponse.ok) {
                const result = await fallbackResponse.json();
                return result;
            }
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
        console.error("Error sending notification:", error);
        throw error;
    }
}
