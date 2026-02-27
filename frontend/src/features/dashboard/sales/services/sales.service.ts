import { apiClient } from "@/shared/utils/apiClient";
import {
    ISale,
    ICreateSaleDto,
    IProduct,
    ICustomer,
    IService,
} from "../types/sales.type";

type CustomerApi = {
    customerid?: number;
    id?: number;
    userid?: number;
    customercity?: string | null;
    customerzipcode?: string | null;
    users?: {
        userid?: number;
        name?: string | null;
        lastname?: string | null;
        documentnumber?: string | null;
        phone?: string | null;
        email?: string | null;
        image?: string | null;
    } | null;
};

function unwrapList<T>(payload: any): T[] {
    const data =
        payload && typeof payload === "object" && "data" in payload
            ? (payload as any).data
            : payload;
    return Array.isArray(data) ? (data as T[]) : [];
}

function normalizeCustomer(customer: CustomerApi): ICustomer | null {
    const customerid = Number(customer.customerid ?? customer.id);
    if (!Number.isFinite(customerid) || customerid <= 0) return null;

    const user = customer.users ?? null;

    return {
        customerid,
        userid: Number(customer.userid ?? user?.userid ?? 0) || 0,
        customercity: customer.customercity ?? null,
        customerzipcode: customer.customerzipcode ?? null,
        users: user
            ? {
                userid: Number(user.userid ?? 0) || 0,
                name: String(user.name ?? "").trim(),
                lastname: String(user.lastname ?? "").trim(),
                documentnumber: user.documentnumber != null ? String(user.documentnumber).trim() : null,
                phone: user.phone != null ? String(user.phone).trim() : null,
                email: String(user.email ?? "").trim(),
                image: user.image != null ? String(user.image).trim() : null,
            }
            : undefined,
    };
}

// ─────────────────────────────────────────────────────
// Servicio de Ventas — conecta con el backend NestJS
// ─────────────────────────────────────────────────────

/** Obtener todas las ventas */
export async function getSales(): Promise<ISale[]> {
    return apiClient.get<ISale[]>("/sales");
}

/** Obtener una venta por ID */
export async function getSaleById(id: number): Promise<ISale> {
    return apiClient.get<ISale>(`/sales/${id}`);
}

/** Crear una nueva venta */
export async function createSale(data: ICreateSaleDto): Promise<ISale> {
    return apiClient.post<ISale>("/sales", data);
}

/** Anular una venta (cambiar estado a Cancelled con motivo) */
export async function annulSale(
    id: number,
    reason: string,
    cancelledBy: string
): Promise<ISale> {
    return apiClient.patch<ISale>(`/sales/${id}`, {
        salestatus: "Cancelled",
        notes: reason,
        createdby: cancelledBy,
    });
}

/** Eliminar una venta por ID */
export async function deleteSale(id: number): Promise<void> {
    return apiClient.delete<void>(`/sales/${id}`);
}

// ── Servicios auxiliares para el formulario ──

/** Obtener todos los productos (para el buscador) */
export async function getProducts(): Promise<IProduct[]> {
    return apiClient.get<IProduct[]>("/products");
}

/** Obtener todos los clientes (para el selector) */
export async function getCustomers(): Promise<ICustomer[]> {
    const response = await apiClient.get<any>("/customers", {
        params: { includeRelations: true },
    });

    return unwrapList<CustomerApi>(response)
        .map(normalizeCustomer)
        .filter(Boolean) as ICustomer[];
}

/** Obtener todos los servicios */
export async function getServices(): Promise<{ data: IService[] }> {
    return apiClient.get<{ data: IService[] }>("/services");
}

/** Actualizar estado de pago de una venta */
export async function updateEstadoPago(
    id: number,
    estadoPago: 'Abonada' | 'Pagada'
): Promise<ISale> {
    return apiClient.patch<ISale>(`/sales/${id}/estado-pago`, { estadoPago });
}
