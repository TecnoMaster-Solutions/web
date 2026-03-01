"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/features/auth/authcontext";
import {
    approveSalePaymentRequest,
    createSalePaymentRequest,
    getClientSalePaymentRequests,
    getSaleById,
    getSalePaymentRequests,
    rejectSalePaymentRequest,
    uploadSalePaymentReceipt,
} from "../services/sales.service";
import {
    ICreateSalePaymentRequestDto,
    IReviewSalePaymentRequestDto,
    ISale,
    ISalePaymentRequest,
    SalePaymentRequestStatus,
    SalePaymentRequestType,
} from "../types/Sales.type";
import { showError, showSuccess, showWarning } from "@/shared/utils/notifications";
import { resolveAssetUrl } from "../utils/assetUrl";

interface SalePaymentRequestsSectionProps {
    sale: ISale;
    onSaleUpdated: (sale: ISale) => void;
}

const REQUEST_TYPE_LABELS: Record<SalePaymentRequestType, string> = {
    HALF: "Mitad",
    FULL: "Todo",
    REMAINING: "Restante",
};

const STATUS_LABELS: Record<SalePaymentRequestStatus, string> = {
    PendingReceipt: "Pendiente de comprobante",
    ReceiptUploaded: "Comprobante cargado",
    Approved: "Aprobada",
    Rejected: "Rechazada",
    Cancelled: "Cancelada",
};

const REAL_PAYMENT_METHOD_OPTIONS = ["Transferencia", "Efectivo"] as const;

function formatCurrency(value: number) {
    return `$${Number(value || 0).toLocaleString("es-CO")}`;
}

function formatDateTime(value?: string | null) {
    if (!value) return "Sin fecha";
    return new Date(value).toLocaleString("es-CO");
}

function statusClasses(status: SalePaymentRequestStatus) {
    if (status === "Approved") return "bg-green-100 text-green-700";
    if (status === "Rejected") return "bg-red-100 text-red-700";
    if (status === "ReceiptUploaded") return "bg-blue-100 text-blue-700";
    if (status === "Cancelled") return "bg-gray-200 text-gray-700";
    return "bg-amber-100 text-amber-700";
}

function receiptStatusLabel(request: ISalePaymentRequest) {
    if (request.status === "Approved") return "Aprobado";
    if (request.status === "Rejected") return "Rechazado";
    if (request.status === "ReceiptUploaded") return "Cargado";
    return "Pendiente";
}

function systemReference(request: ISalePaymentRequest) {
    const prefix = request.requestType === "HALF" ? "PM" : "PT";
    return `${prefix}-${request.paymentRequestId}`;
}

function resolveApprovedPayment(request: ISalePaymentRequest, sale: ISale) {
    if (request.approvedPayment) return request.approvedPayment;
    if (!request.approvedPaymentId) return null;

    return (
        (sale.payments ?? []).find(
            (payment) => payment.paymentid === request.approvedPaymentId
        ) ?? null
    );
}

export default function SalePaymentRequestsSection({
    sale,
    onSaleUpdated,
}: SalePaymentRequestsSectionProps) {
    const onSaleUpdatedRef = useRef(onSaleUpdated);
    const { user } = useAuth();
    const permissions = Array.isArray((user as any)?.permissions) ? (user as any).permissions : [];
    const canManagePayments = permissions.includes("sales.manage_payment");

    const [requests, setRequests] = useState<ISalePaymentRequest[]>(sale.paymentRequests ?? []);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [reviewingId, setReviewingId] = useState<number | null>(null);
    const [uploadingId, setUploadingId] = useState<number | null>(null);

    const [requestType, setRequestType] = useState<SalePaymentRequestType>("HALF");
    const [adminNotes, setAdminNotes] = useState("");
    const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
    const [reviewReference, setReviewReference] = useState<Record<number, string>>({});
    const [reviewMethod, setReviewMethod] = useState<Record<number, string>>({});
    const [receiptNotes, setReceiptNotes] = useState<Record<number, string>>({});
    const [receiptFiles, setReceiptFiles] = useState<Record<number, File | null>>({});
    const [receiptErrors, setReceiptErrors] = useState<Record<number, string>>({});

    useEffect(() => {
        onSaleUpdatedRef.current = onSaleUpdated;
    }, [onSaleUpdated]);

    useEffect(() => {
        setRequests(sale.paymentRequests ?? []);
    }, [sale.paymentRequests, sale.saleid]);

    const approvedPaymentsCount = useMemo(
        () => (sale.payments ?? []).length,
        [sale.payments]
    );
    const paidAmount = Number(sale.paidamount ?? 0);
    const totalAmount = Number(sale.totalamount ?? 0);
    const pendingAmount = useMemo(
        () => Math.max(0, Number((totalAmount - paidAmount).toFixed(2))),
        [paidAmount, totalAmount]
    );

    const activeRequest = useMemo(
        () =>
            requests.find(
                (request) =>
                    request.status === "PendingReceipt" || request.status === "ReceiptUploaded"
            ) ?? null,
        [requests]
    );

    const allowedRequestTypes = useMemo(() => {
        if (pendingAmount <= 0 || approvedPaymentsCount >= 2) return [] as SalePaymentRequestType[];
        if (approvedPaymentsCount > 0 || sale.paymentstatus === "Abonada") return ["REMAINING"];
        return ["HALF", "FULL"];
    }, [approvedPaymentsCount, pendingAmount, sale.paymentstatus]);

    const expectedAmount = useMemo(() => {
        if (requestType === "HALF") return Number((pendingAmount / 2).toFixed(2));
        return pendingAmount;
    }, [pendingAmount, requestType]);

    const refreshAll = useCallback(async () => {
        setLoading(true);
        try {
            const [freshSale, freshRequests] = await Promise.all([
                getSaleById(sale.saleid),
                canManagePayments
                    ? getSalePaymentRequests(sale.saleid)
                    : getClientSalePaymentRequests(sale.saleid),
            ]);

            setRequests(freshRequests);
            onSaleUpdatedRef.current(freshSale);
        } catch (error) {
            console.error(error);
            showError("No se pudo actualizar el flujo de pagos.");
        } finally {
            setLoading(false);
        }
    }, [canManagePayments, sale.saleid]);

    useEffect(() => {
        void refreshAll();
    }, [refreshAll]);

    useEffect(() => {
        if (!allowedRequestTypes.includes(requestType)) {
            setRequestType(allowedRequestTypes[0] ?? "HALF");
        }
    }, [allowedRequestTypes, requestType]);

    const createRequest = async () => {
        if (!allowedRequestTypes.includes(requestType)) {
            showWarning("El tipo de solicitud no aplica para el estado actual de la venta.");
            return;
        }

        const payload: ICreateSalePaymentRequestDto = {
            requestType,
            expectedAmount,
            adminNotes: adminNotes.trim() || undefined,
        };

        setCreating(true);
        try {
            await createSalePaymentRequest(sale.saleid, payload);
            showSuccess("Solicitud de pago creada correctamente.");
            setAdminNotes("");
            await refreshAll();
        } catch (error: any) {
            console.error(error);
            showError(error?.response?.data?.message ?? "No se pudo crear la solicitud.");
        } finally {
            setCreating(false);
        }
    };

    const submitApproval = async (paymentRequestId: number) => {
        setReviewingId(paymentRequestId);
        try {
            const payload: IReviewSalePaymentRequestDto = {
                reviewNotes: reviewNotes[paymentRequestId]?.trim() || undefined,
                reference: reviewReference[paymentRequestId]?.trim() || undefined,
                paymentmethod: reviewMethod[paymentRequestId]?.trim() || sale.paymentmethod || undefined,
            };

            await approveSalePaymentRequest(paymentRequestId, payload);
            showSuccess("Solicitud aprobada y pago real registrado.");
            await refreshAll();
        } catch (error: any) {
            console.error(error);
            showError(error?.response?.data?.message ?? "No se pudo aprobar la solicitud.");
        } finally {
            setReviewingId(null);
        }
    };

    const submitReject = async (paymentRequestId: number) => {
        setReviewingId(paymentRequestId);
        try {
            await rejectSalePaymentRequest(paymentRequestId, {
                reviewNotes: reviewNotes[paymentRequestId]?.trim() || undefined,
            });
            showSuccess("Solicitud rechazada.");
            await refreshAll();
        } catch (error: any) {
            console.error(error);
            showError(error?.response?.data?.message ?? "No se pudo rechazar la solicitud.");
        } finally {
            setReviewingId(null);
        }
    };

    const submitReceipt = async (paymentRequestId: number) => {
        const file = receiptFiles[paymentRequestId] ?? null;
        if (!file) {
            setReceiptErrors((prev) => ({
                ...prev,
                [paymentRequestId]: "Debes seleccionar un archivo antes de enviarlo.",
            }));
            showError("Debes adjuntar el comprobante para continuar.");
            return;
        }

        setReceiptErrors((prev) => ({
            ...prev,
            [paymentRequestId]: "",
        }));
        setUploadingId(paymentRequestId);
        try {
            await uploadSalePaymentReceipt(paymentRequestId, {
                file,
                receiptNotes: receiptNotes[paymentRequestId]?.trim() || undefined,
            });
            showSuccess("Comprobante cargado correctamente.");
            setReceiptFiles((prev) => ({ ...prev, [paymentRequestId]: null }));
            setReceiptErrors((prev) => ({ ...prev, [paymentRequestId]: "" }));
            await refreshAll();
        } catch (error: any) {
            console.error(error);
            showError(error?.response?.data?.message ?? "No se pudo subir el comprobante.");
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Flujo de pagos con aprobación</h3>
                    
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-base font-semibold">{formatCurrency(totalAmount)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Pagado aprobado</div>
                    <div className="text-base font-semibold">{formatCurrency(paidAmount)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Pendiente</div>
                    <div className="text-base font-semibold">{formatCurrency(pendingAmount)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Pagos reales</div>
                    <div className="text-base font-semibold">{approvedPaymentsCount} / 2</div>
                </div>
            </div>

            {canManagePayments ? (
                <div className="mb-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                    <div className="mb-3">
                        <h4 className="font-semibold text-gray-900">Nueva solicitud de pago</h4>
                        <p className="text-sm text-gray-500">
                            El admin define el monto esperado; el cliente solo carga el comprobante.
                        </p>
                    </div>

                    {sale.paymentstatus === "Pagada" ? (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                            La venta ya está Pagada. No se permiten nuevas solicitudes.
                        </div>
                    ) : approvedPaymentsCount >= 2 ? (
                        <div className="rounded-md bg-gray-100 p-3 text-sm text-gray-700">
                            La venta ya alcanzó el máximo de 2 pagos reales aprobados.
                        </div>
                    ) : activeRequest ? (
                        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                            Ya existe una solicitud abierta. Debe aprobarse o rechazarse antes de crear otra.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Tipo de solicitud
                                </label>
                                <select
                                    value={requestType}
                                    onChange={(event) => setRequestType(event.target.value as SalePaymentRequestType)}
                                    className="w-full rounded-lg border border-gray-300 p-2"
                                >
                                    {allowedRequestTypes.map((option) => (
                                        <option key={option} value={option}>
                                            {REQUEST_TYPE_LABELS[option]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Monto esperado
                                </label>
                                <input
                                    type="text"
                                    value={formatCurrency(expectedAmount)}
                                    readOnly
                                    className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2 text-gray-700"
                                />
                            </div>

                            <div className="md:col-span-3">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Nota administrativa
                                </label>
                                <textarea
                                    rows={3}
                                    value={adminNotes}
                                    onChange={(event) => setAdminNotes(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 p-2"
                                    placeholder="Opcional"
                                />
                            </div>

                            <div className="md:col-span-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={createRequest}
                                    disabled={creating || expectedAmount <= 0}
                                    className="cursor-pointer rounded-lg bg-[#2a9781] px-4 py-2 text-sm font-medium text-white transition duration-300 hover:scale-105 hover:bg-[#227a69] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {creating ? "Creando..." : "Crear solicitud"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            <div className="space-y-4">
                {requests.length === 0 ? (
                    <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
                        No hay solicitudes de pago registradas para esta venta.
                    </div>
                ) : (
                    requests.map((request) => {
                        const approvedPayment = resolveApprovedPayment(request, sale);
                        const canClientUpload =
                            !canManagePayments &&
                            (request.status === "PendingReceipt" || request.status === "ReceiptUploaded");
                        const canAdminReview = canManagePayments && request.status === "ReceiptUploaded";
                        const savingThisReview = reviewingId === request.paymentRequestId;
                        const uploadingThisReceipt = uploadingId === request.paymentRequestId;

                        return (
                            <div
                                key={request.paymentRequestId}
                                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                            >
                                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            Solicitud #{request.paymentRequestId} - {REQUEST_TYPE_LABELS[request.requestType]}
                                        </div>
                                        <div className="mt-1 text-sm text-gray-600">
                                            Monto esperado: <span className="font-medium">{formatCurrency(request.expectedAmount)}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            Creada: {formatDateTime(request.createdAt)}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses(request.status)}`}>
                                            {STATUS_LABELS[request.status]}
                                        </span>
                                        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-700">
                                            Comprobante: {receiptStatusLabel(request)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                    <div>
                                        <div className="text-gray-500">Nota admin</div>
                                        <div className="font-medium text-gray-800">{request.adminNotes || "Sin nota"}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Referencia comprobante</div>
                                        <div className="font-medium text-gray-800">{request.receiptReference || systemReference(request)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Comprobante</div>
                                        {request.receiptUrl ? (
                                            <a
                                                href={resolveAssetUrl(request.receiptUrl)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-medium text-blue-600 underline"
                                            >
                                                Ver archivo
                                            </a>
                                        ) : (
                                            <div className="font-medium text-gray-500">No cargado</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Subido el</div>
                                        <div className="font-medium text-gray-800">{formatDateTime(request.receiptUploadedAt)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Revisión</div>
                                        <div className="font-medium text-gray-800">{request.reviewNotes || "Sin observación"}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Pago real asociado</div>
                                        <div className="font-medium text-gray-800">
                                            {approvedPayment ? `${formatCurrency(approvedPayment.amount)} - ${formatDateTime(approvedPayment.createdat)}` : "Aún no registrado"}
                                        </div>
                                    </div>
                                </div>

                                {canClientUpload ? (
                                    <div className="mt-4 rounded-lg border border-white bg-white p-4">
                                        <div className="mb-3 text-sm font-semibold text-gray-900">
                                            Subir comprobante
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Referencia generada
                                                </label>
                                                <div className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2 text-gray-700">
                                                    {systemReference(request)}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Archivo
                                                </label>
                                                <label className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-700 hover:bg-gray-50">
                                                    <span className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
                                                        Seleccionar archivo
                                                    </span>
                                                    <span className="truncate text-gray-500">
                                                        {receiptFiles[request.paymentRequestId]?.name ||
                                                            "Ningún archivo seleccionado"}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,image/*"
                                                        onChange={(event) =>
                                                            {
                                                                setReceiptFiles((prev) => ({
                                                                    ...prev,
                                                                    [request.paymentRequestId]: event.target.files?.[0] ?? null,
                                                                }));
                                                                setReceiptErrors((prev) => ({
                                                                    ...prev,
                                                                    [request.paymentRequestId]: "",
                                                                }));
                                                            }
                                                        }
                                                        className="hidden"
                                                    />
                                                </label>
                                                {receiptErrors[request.paymentRequestId] ? (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {receiptErrors[request.paymentRequestId]}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Nota del comprobante
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={receiptNotes[request.paymentRequestId] ?? request.receiptNotes ?? ""}
                                                    onChange={(event) =>
                                                        setReceiptNotes((prev) => ({
                                                            ...prev,
                                                            [request.paymentRequestId]: event.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 p-2"
                                                    placeholder="Opcional"
                                                />
                                            </div>
                                            <div className="md:col-span-2 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => void submitReceipt(request.paymentRequestId)}
                                                    disabled={uploadingThisReceipt}
                                                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {uploadingThisReceipt ? "Subiendo..." : request.receiptUrl ? "Reemplazar comprobante" : "Enviar comprobante"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {canAdminReview ? (
                                    <div className="mt-4 rounded-lg border border-white bg-white p-4">
                                        <div className="mb-3 text-sm font-semibold text-gray-900">
                                            Revisión administrativa
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Método de pago real
                                                </label>
                                                <select
                                                    value={
                                                        reviewMethod[request.paymentRequestId] ??
                                                        (REAL_PAYMENT_METHOD_OPTIONS.includes(
                                                            sale.paymentmethod as (typeof REAL_PAYMENT_METHOD_OPTIONS)[number]
                                                        )
                                                            ? sale.paymentmethod
                                                            : "Transferencia")
                                                    }
                                                    onChange={(event) =>
                                                        setReviewMethod((prev) => ({
                                                            ...prev,
                                                            [request.paymentRequestId]: event.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 p-2"
                                                >
                                                    {REAL_PAYMENT_METHOD_OPTIONS.map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Referencia real
                                                </label>
                                                <input
                                                    type="text"
                                                    value={reviewReference[request.paymentRequestId] ?? request.receiptReference ?? ""}
                                                    onChange={(event) =>
                                                        setReviewReference((prev) => ({
                                                            ...prev,
                                                            [request.paymentRequestId]: event.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 p-2"
                                                    placeholder="Opcional"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Observación de revisión
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={reviewNotes[request.paymentRequestId] ?? ""}
                                                    onChange={(event) =>
                                                        setReviewNotes((prev) => ({
                                                            ...prev,
                                                            [request.paymentRequestId]: event.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 p-2"
                                                    placeholder="Opcional"
                                                />
                                            </div>
                                            <div className="md:col-span-2 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void submitReject(request.paymentRequestId)}
                                                    disabled={savingThisReview}
                                                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Rechazar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void submitApproval(request.paymentRequestId)}
                                                    disabled={savingThisReview}
                                                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {savingThisReview ? "Procesando..." : "Aprobar y registrar pago"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}



