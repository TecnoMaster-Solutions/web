"use client";

import { useEffect, useMemo, useState } from "react";
import { createSalePayment, getSalePayments } from "../services/sales.service";
import { ISale, ISalesPayment } from "../types/sales.type";
import { showError, showSuccess, showWarning } from "@/shared/utils/notifications";
import { resolveAssetUrl } from "../utils/assetUrl";

interface SalePaymentSectionProps {
    sale: ISale;
    onSaleUpdated: (sale: ISale) => void;
}

function formatCurrency(value: number) {
    return `$${Number(value || 0).toLocaleString("es-CO")}`;
}

function formatDisplayAmount(value: string) {
    const numericValue = Number(value || 0);
    if (!Number.isFinite(numericValue) || numericValue <= 0) return "";
    return numericValue.toLocaleString("es-CO");
}

function formatAmountInput(value: number) {
    if (!Number.isFinite(value) || value <= 0) return "";
    return Number(value.toFixed(2)).toString();
}

function getStatusLabel(status: ISale["paymentstatus"]) {
    if (status === "Pagada") return "Pagada";
    if (status === "Abonada") return "Abonada";
    return "Pendiente";
}

export default function SalePaymentSection({ sale, onSaleUpdated }: SalePaymentSectionProps) {
    const [payments, setPayments] = useState<ISalesPayment[]>(sale.payments ?? []);
    const [amount, setAmount] = useState("");
    const [reference, setReference] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedQuickOption, setSelectedQuickOption] = useState<"full" | "half" | null>(null);

    useEffect(() => {
        getSalePayments(sale.saleid)
            .then(setPayments)
            .catch((error) => {
                console.error(error);
                showError("No se pudieron cargar los pagos de la venta.");
            });
    }, [sale.saleid]);

    const paidAmount = Number(sale.paidamount ?? 0);
    const totalAmount = Number(sale.totalamount ?? 0);
    const pendingAmount = useMemo(
        () => Math.max(0, Number((totalAmount - paidAmount).toFixed(2))),
        [paidAmount, totalAmount]
    );

    const nextPaymentNumber = payments.length + 1;
    const canRegisterPayment = sale.paymentstatus !== "Pagada" && payments.length < 2;
    const secondPaymentEnabled = sale.paymentstatus === "Abonada" && payments.length === 1;
    const halfPendingAmount = pendingAmount / 2;
    const showQuickSelector = sale.paymentstatus === "Pending" && payments.length === 0;

    useEffect(() => {
        if (sale.paymentstatus === "Abonada") {
            setAmount(formatAmountInput(pendingAmount));
            setSelectedQuickOption("full");
            return;
        }

        if (sale.paymentstatus === "Pagada") {
            setAmount("");
            setSelectedQuickOption(null);
        }
    }, [pendingAmount, sale.paymentstatus]);

    const fillFullPayment = () => {
        setAmount(formatAmountInput(pendingAmount));
        setSelectedQuickOption("full");
    };

    const fillHalfPayment = () => {
        setAmount(formatAmountInput(halfPendingAmount));
        setSelectedQuickOption("half");
    };

    const submitPayment = async () => {
        const numericAmount = Number(amount);

        if (!numericAmount || numericAmount <= 0) {
            showWarning("Debe ingresar un valor pagado mayor a 0.");
            return;
        }

        if (numericAmount > pendingAmount) {
            showWarning(`El valor pagado no puede superar el pendiente (${formatCurrency(pendingAmount)}).`);
            return;
        }

        if (file && !numericAmount) {
            showWarning("No puede adjuntar comprobante sin monto.");
            return;
        }

        setSaving(true);
        try {
            const response = await createSalePayment(sale.saleid, {
                amount: numericAmount,
                paymentmethod: sale.paymentmethod,
                reference,
                file,
            });

            setPayments((prev) => [...prev, response.payment]);
            onSaleUpdated({
                ...response.sale,
                payments: [...payments, response.payment],
            });
            setAmount("");
            setReference("");
            setFile(null);

            showSuccess(
                response.sale.paymentstatus === "Pagada"
                    ? "Pago registrado. La venta quedó Pagada."
                    : "Pago registrado. La venta quedó Abonada."
            );
        } catch (error: any) {
            console.error(error);
            showError(error?.response?.data?.message ?? "No se pudo registrar el pago.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Pagos de la venta</h3>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-base font-semibold">{formatCurrency(totalAmount)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Pagado</div>
                    <div className="text-base font-semibold">{formatCurrency(paidAmount)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Pendiente</div>
                    <div className="text-base font-semibold">{formatCurrency(pendingAmount)}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Estado</div>
                    <div className="text-base font-semibold">{getStatusLabel(sale.paymentstatus)}</div>
                </div>
            </div>

            {payments.length > 0 ? (
                <div className="mb-4 space-y-2">
                    {payments.map((payment, index) => (
                        <div
                            key={payment.paymentid}
                            className="flex flex-col gap-2 rounded-md border border-gray-200 p-3 text-sm md:flex-row md:items-center md:justify-between"
                        >
                            <div>
                                <div className="font-medium">Comprobante {index + 1}</div>
                                <div className="text-gray-500">Valor: {formatCurrency(payment.amount)}</div>
                                <div className="text-gray-500">Referencia: {payment.reference || "Sin referencia"}</div>
                            </div>
                            <div>
                                {payment.invoiceurl ? (
                                    <a
                                        href={resolveAssetUrl(payment.invoiceurl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        Ver comprobante
                                    </a>
                                ) : (
                                    <span className="text-gray-400">Sin archivo</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {canRegisterPayment ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {showQuickSelector ? (
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Selección rápida
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={fillFullPayment}
                                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${selectedQuickOption === "full"
                                        ? "border-green-600 bg-green-600 text-white"
                                        : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    Pagar todo
                                </button>
                                <button
                                    type="button"
                                    onClick={fillHalfPayment}
                                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${selectedQuickOption === "half"
                                        ? "border-green-600 bg-green-600 text-white"
                                        : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    Pagar mitad
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Valor pagado</label>
                        <input
                            type="text"
                            value={formatDisplayAmount(amount)}
                            readOnly
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-700"
                            placeholder="Selecciona pagar todo o pagar mitad"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Referencia</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(event) => setReference(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2"
                            placeholder="Opcional"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {nextPaymentNumber === 1 ? "Comprobante 1" : "Comprobante 2"}
                        </label>
                        <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                            className="block w-full text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            El comprobante es opcional, pero no se puede enviar sin monto.
                        </p>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="button"
                            onClick={submitPayment}
                            disabled={
                                saving ||
                                !amount ||
                                Number(amount) <= 0 ||
                                Number(amount) > pendingAmount ||
                                (nextPaymentNumber === 2 && !secondPaymentEnabled)
                            }
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? "Guardando..."
                                : nextPaymentNumber === 1
                                    ? "Registrar pago 1"
                                    : "Registrar pago 2"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                    La venta ya está Pagada o alcanzó el máximo de 2 comprobantes.
                </div>
            )}
        </div>
    );
}
