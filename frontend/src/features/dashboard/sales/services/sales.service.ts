import { apiClient } from "@/shared/utils/apiClient";
import { uploadFile } from "@/shared/services/uploadFile";
import {
    ISale,
    ISalesPaginatedResult,
    ISalesPayment,
    ICreateSaleDto,
    ICreateSalePaymentDto,
    ICreateSalePaymentRequestDto,
    IProduct,
    ICustomer,
    IService,
    ISalePaymentRequest,
    IReviewSalePaymentRequestDto,
    IUploadSalePaymentReceiptDto,
} from "../types/Sales.type";

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

type PayloadWithData<T> = {
    data?: T;
};

type PaginationShape = {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
};

type PaginatedPayload<T> = {
    data?: T[];
    meta?: PaginationShape;
};

function unwrapList<T>(payload: unknown): T[] {
    const data =
        payload && typeof payload === "object" && "data" in payload
            ? (payload as PayloadWithData<T[]>).data
            : payload;
    return Array.isArray(data) ? (data as T[]) : [];
}

function asPaginatedList<T>(
    payload: unknown
): { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } } | null {
    if (!payload || typeof payload !== "object") return null;
    const paginatedPayload = payload as PaginatedPayload<T>;
    if (!Array.isArray(paginatedPayload.data) || !paginatedPayload.meta || typeof paginatedPayload.meta !== "object") {
        return null;
    }

    return {
        data: paginatedPayload.data as T[],
        meta: {
            page: Number(paginatedPayload.meta.page ?? 1),
            limit: Number(paginatedPayload.meta.limit ?? 5),
            total: Number(paginatedPayload.meta.total ?? 0),
            totalPages: Number(paginatedPayload.meta.totalPages ?? 1),
        },
    };
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

type GetSalesParams = {
    signal?: AbortSignal;
    page?: number;
    limit?: number;
    search?: string;
};

export function getSales(): Promise<ISale[]>;
export function getSales(params: GetSalesParams): Promise<ISale[] | ISalesPaginatedResult>;
export async function getSales({
    signal,
    page,
    limit,
    search,
}: GetSalesParams = {}): Promise<ISale[] | ISalesPaginatedResult> {
    const shouldPaginate = Number.isInteger(page) && Number.isInteger(limit);
    const response = await apiClient.get<PaginatedPayload<ISale> | ISale[]>("/sales", {
        params: {
            ...(shouldPaginate ? { page, limit } : {}),
            ...(search?.trim() ? { search: search.trim() } : {}),
        },
        signal,
    });

    const paginated = asPaginatedList<ISale>(response);
    if (paginated) {
        return {
            data: paginated.data,
            meta: {
                page: Number(paginated.meta.page ?? page ?? 1),
                limit: Number(paginated.meta.limit ?? limit ?? 5),
                total: Number(paginated.meta.total ?? paginated.data.length),
                totalPages: Number(paginated.meta.totalPages ?? 1),
            },
        };
    }

    const list = unwrapList<ISale>(response);
    if (shouldPaginate) {
        return {
            data: list,
            meta: {
                page: page ?? 1,
                limit: limit ?? 5,
                total: list.length,
                totalPages: 1,
            },
        };
    }

    return list;
}

export async function getSaleById(id: number): Promise<ISale> {
    return apiClient.get<ISale>(`/sales/${id}`);
}

export async function createSale(data: ICreateSaleDto): Promise<ISale> {
    return apiClient.post<ISale>("/sales", data);
}

export async function updateSale(
    id: number,
    data: Partial<ICreateSaleDto>
): Promise<ISale> {
    return apiClient.patch<ISale>(`/sales/${id}`, data);
}

export async function annulSale(
    id: number,
    reason: string,
    cancelledBy: string
): Promise<ISale> {
    return apiClient.patch<ISale>(`/sales/${id}/cancel`, {
        observation: reason,
        cancelledBy,
    });
}

export async function deleteSale(id: number): Promise<void> {
    return apiClient.delete<void>(`/sales/${id}`);
}

export async function getProducts(): Promise<IProduct[]> {
    const response = await apiClient.get<PayloadWithData<IProduct[]> | IProduct[]>("/products");
    return unwrapList<IProduct>(response);
}

export async function getCustomers(): Promise<ICustomer[]> {
    const response = await apiClient.get<PayloadWithData<CustomerApi[]>>("/customers", {
        params: { includeRelations: true },
    });

    return unwrapList<CustomerApi>(response)
        .map(normalizeCustomer)
        .filter(Boolean) as ICustomer[];
}

export async function getServices(): Promise<{ data: IService[] }> {
    const response = await apiClient.get<PayloadWithData<IService[]> | IService[]>("/services");
    const data = unwrapList<IService>(response);
    return { data };
}

export async function getSalePayments(saleId: number): Promise<ISalesPayment[]> {
    return apiClient.get<ISalesPayment[]>(`/sales/${saleId}/payments`);
}

export async function createSalePayment(
    saleId: number,
    data: ICreateSalePaymentDto
): Promise<{ sale: ISale; payment: ISalesPayment }> {
    const formData = new FormData();
    formData.append("amount", String(data.amount));

    if (data.paymentmethod) formData.append("paymentmethod", data.paymentmethod);
    if (data.reference) formData.append("reference", data.reference);
    if (data.file) formData.append("file", data.file);

    return apiClient.post<{ sale: ISale; payment: ISalesPayment }>(
        `/sales/${saleId}/payments`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
}

export async function getSalePaymentRequests(
    saleId?: number
): Promise<ISalePaymentRequest[]> {
    return apiClient.get<ISalePaymentRequest[]>("/sales-payment-requests", {
        params: saleId ? { saleId } : undefined,
    });
}

export async function getClientSalePaymentRequests(
    saleId: number
): Promise<ISalePaymentRequest[]> {
    return apiClient.get<ISalePaymentRequest[]>(`/sales/${saleId}/my-payment-requests`);
}

export async function createSalePaymentRequest(
    saleId: number,
    data: ICreateSalePaymentRequestDto
): Promise<ISalePaymentRequest> {
    return apiClient.post<ISalePaymentRequest>(`/sales/${saleId}/payment-requests`, data);
}

export async function approveSalePaymentRequest(
    paymentRequestId: number,
    data: IReviewSalePaymentRequestDto
): Promise<ISalePaymentRequest> {
    return apiClient.patch<ISalePaymentRequest>(
        `/sales-payment-requests/${paymentRequestId}/approve`,
        data
    );
}

export async function rejectSalePaymentRequest(
    paymentRequestId: number,
    data: IReviewSalePaymentRequestDto
): Promise<ISalePaymentRequest> {
    return apiClient.patch<ISalePaymentRequest>(
        `/sales-payment-requests/${paymentRequestId}/reject`,
        data
    );
}

export async function uploadSalePaymentReceipt(
    paymentRequestId: number,
    data: IUploadSalePaymentReceiptDto
): Promise<ISalePaymentRequest> {
    if (!data.file) {
        throw new Error("Debes adjuntar un archivo.");
    }

    const receiptUrl = await uploadFile(data.file);
    if (!receiptUrl) {
        throw new Error("No se pudo subir el comprobante a Cloudinary.");
    }

    return apiClient.post<ISalePaymentRequest>(
        `/sales/my-payment-requests/${paymentRequestId}/receipt`,
        {
            receiptReference: data.receiptReference,
            receiptNotes: data.receiptNotes,
            receiptUrl,
        },
    );
}
