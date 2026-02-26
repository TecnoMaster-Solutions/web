import { apiClient } from "@/shared/utils/apiClient";
import {
    ISale,
    ICreateSaleDto,
    IProduct,
    ICustomer,
    IService,
} from "../types/sales.type";

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
    return apiClient.get<ICustomer[]>("/customers");
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
