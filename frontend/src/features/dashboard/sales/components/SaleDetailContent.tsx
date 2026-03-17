"use client";

import { useEffect, useState } from "react";
import { ISale, ISaleDetail } from "../types/Sales.type";
import { getSaleById } from "../services/sales.service";
import SalePaymentRequestsSection from "./SalePaymentRequestsSection";
import { resolveAssetUrl } from "../utils/assetUrl";

interface SaleDetailContentProps {
    saleId: number;
    onBack?: () => void;
}

function Loader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
    );
}

function formatDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatCurrency(value: number) {
    return `$${Number(value || 0).toLocaleString("es-CO")}`;
}

function paymentMethodLabel(method?: string | null) {
    const normalized = String(method ?? "").trim().toLowerCase();
    if (normalized === "cash") return "Efectivo";
    return method || "No definido";
}

function isGatewayPaymentMethod(method?: string | null) {
    const normalized = String(method ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    return normalized === "pasarela de pago";
}

function paymentStatusLabel(status: ISale["paymentstatus"]) {
    if (status === "Pagada") return "Pagada";
    if (status === "Abonada") return "Abonada";
    return "Pendiente";
}

function saleStatusLabel(sale: ISale) {
    if (sale.paymentstatus === "Pagada" || sale.salestatus === "Completed") {
        return "Finalizada";
    }
    if (sale.salestatus === "Pending") {
        return "Pendiente";
    }
    if (sale.salestatus === "Cancelled") {
        return "Anulada";
    }
    return sale.salestatus;
}

function saleStatusClasses(sale: ISale) {
    if (sale.paymentstatus === "Pagada" || sale.salestatus === "Completed") {
        return "bg-green-100 text-green-700";
    }
    if (sale.salestatus === "Pending") {
        return "bg-orange-100 text-orange-700";
    }
    if (sale.salestatus === "Cancelled") {
        return "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-700";
}

export default function SaleDetailContent({ saleId, onBack }: SaleDetailContentProps) {
    const [sale, setSale] = useState<ISale | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        setError("");
        getSaleById(saleId)
            .then((data) => setSale(data))
            .catch((err) => {
                console.error(err);
                setError("No se pudo cargar la informacion de la venta.");
            })
            .finally(() => setLoading(false));
    }, [saleId]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="text-red-500 p-4 text-center">{error}</div>;
    }

    if (!sale) {
        return null;
    }

    const productItems = (sale.salesdetail ?? []).filter((detail) => !!detail.productid);
    const serviceItems = (sale.salesdetail ?? []).filter((detail) => !!detail.serviceid);
    const shouldShowManualPaymentSections = !isGatewayPaymentMethod(sale.paymentmethod);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                            <rect x="3" y="7" width="18" height="13" rx="2" ry="2"></rect>
                            <path d="M16 3v4"></path>
                            <path d="M8 3v4"></path>
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Detalle de Venta</h2>
                        <p className="text-sm text-gray-500">{sale.salecode}</p>
                    </div>
                </div>
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                        Volver
                    </button>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-700 mb-2">Informacion del Cliente</h4>
                    <p><span className="font-medium">Nombre:</span> {sale.customer?.users ? `${sale.customer.users.name} ${sale.customer.users.lastname}` : `Cliente #${sale.customerid}`}</p>
                    <p><span className="font-medium">Ciudad:</span> {sale.customer?.customercity || "N/A"}</p>
                    <p><span className="font-medium">Correo:</span> {sale.customer?.users?.email || "N/A"}</p>
                    <p><span className="font-medium">Telefono:</span> {sale.customer?.users?.phone || "N/A"}</p>
                    <p><span className="font-medium">Documento:</span> {sale.customer?.users?.documentnumber || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-700 mb-2">Datos de la Venta</h4>
                    <p><span className="font-medium">Numero Venta:</span> {sale.salecode || "-"}</p>
                    <p><span className="font-medium">Fecha:</span> {formatDate(sale.saledate)}</p>
                    <p>
                        <span className="font-medium">Estado venta:</span>{" "}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${saleStatusClasses(sale)}`}>
                            {saleStatusLabel(sale)}
                        </span>
                    </p>
                    <p><span className="font-medium">Estado pago:</span> {paymentStatusLabel(sale.paymentstatus)}</p>
                    <p><span className="font-medium">Metodo de pago:</span> {paymentMethodLabel(sale.paymentmethod)}</p>
                    <p><span className="font-medium">Creado por:</span> {sale.createdby || "Sistema"}</p>
                    <p><span className="font-medium">Creado el:</span> {sale.createddate ? formatDate(sale.createddate) : "N/A"}</p>
                    <p><span className="font-medium">Actualizado el:</span> {sale.updateddate ? formatDate(sale.updateddate) : "N/A"}</p>
                </div>
            </div>

            {shouldShowManualPaymentSections ? (
                <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="font-bold text-gray-700 mb-3">Resumen de pago</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4 text-sm">
                        <div><div className="text-gray-500">Total</div><div className="font-semibold">{formatCurrency(sale.totalamount)}</div></div>
                        <div><div className="text-gray-500">Pagado</div><div className="font-semibold">{formatCurrency(sale.paidamount)}</div></div>
                        <div><div className="text-gray-500">Pendiente</div><div className="font-semibold">{formatCurrency(sale.pendingamount ?? sale.totalamount - sale.paidamount)}</div></div>
                        <div><div className="text-gray-500">Pagos reales</div><div className="font-semibold">{sale.payments?.length ?? 0} / 2</div></div>
                    </div>
                </div>
            ) : null}

            <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-bold text-gray-700 mb-3">Resumen general</h4>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <div><div className="text-gray-500">Subtotal</div><div className="font-semibold">{formatCurrency(sale.subtotal)}</div></div>
                    <div><div className="text-gray-500">Impuestos</div><div className="font-semibold">{formatCurrency(sale.taxamount)}</div></div>
                    <div><div className="text-gray-500">Total final</div><div className="font-semibold">{formatCurrency(sale.totalamount)}</div></div>
                </div>
            </div>

            {shouldShowManualPaymentSections ? (
                <>
                    <div className="rounded-lg bg-gray-50 p-4">
                        <h4 className="font-bold text-gray-700 mb-3">Pagos registrados</h4>
                        {sale.payments && sale.payments.length > 0 ? (
                            <div className="space-y-2">
                                {sale.payments.map((payment, index) => (
                                    <div key={payment.paymentid} className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="font-medium">Pago aprobado {index + 1}</div>
                                            <div className="text-gray-500">Monto: {formatCurrency(payment.amount)}</div>
                                            <div className="text-gray-500">Metodo: {paymentMethodLabel(payment.paymentmethod)}</div>
                                            <div className="text-gray-500">Referencia: {payment.reference || "Sin referencia"}</div>
                                            <div className="text-gray-500">Fecha: {formatDate(payment.createdat)}</div>
                                        </div>
                                        <div>
                                            {payment.invoiceurl ? (
                                                <a href={resolveAssetUrl(payment.invoiceurl)} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                                    Ver comprobante
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">Sin archivo</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">No hay pagos registrados para esta venta.</div>
                        )}
                    </div>

                    <SalePaymentRequestsSection sale={sale} onSaleUpdated={setSale} />
                </>
            ) : null}

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                        <rect x="3" y="7" width="18" height="13" rx="2" ry="2"></rect>
                        <path d="M16 3v4"></path>
                        <path d="M8 3v4"></path>
                    </svg>
                    <h4 className="font-bold text-gray-700">Detalle de Productos y Servicios</h4>
                </div>

                <div>
                    <h4 className="mb-2 text-sm font-semibold text-gray-700">Productos</h4>
                    <div className="overflow-auto border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 font-semibold">
                                <tr>
                                    <th className="p-3">Nombre del producto</th>
                                    <th className="p-3 text-center">Imagen</th>
                                    <th className="p-3 text-center">Cant.</th>
                                    <th className="p-3 text-right">Precio unitario</th>
                                    <th className="p-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {productItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-400">
                                            No hay productos agregados
                                        </td>
                                    </tr>
                                ) : (
                                    productItems.map((detail: ISaleDetail) => (
                                        <tr key={detail.saledetailid} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="font-medium text-gray-800">
                                                    {detail.products?.productname || "Producto"}
                                                </div>
                                                {detail.notes ? (
                                                    <div className="text-xs text-gray-400">{detail.notes}</div>
                                                ) : null}
                                            </td>
                                            <td className="p-3 text-center">
                                                {detail.products?.image ? (
                                                    <img
                                                        src={detail.products.image}
                                                        alt={detail.products?.productname || "Producto"}
                                                        className="w-8 h-8 rounded object-cover mx-auto border"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded bg-gray-200 mx-auto flex items-center justify-center text-xs text-gray-500">
                                                        N/A
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">{detail.quantity}</td>
                                            <td className="p-3 text-right">{formatCurrency(detail.unitprice)}</td>
                                            <td className="p-3 text-right font-semibold">{formatCurrency(detail.linetotal)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h4 className="mb-2 text-sm font-semibold text-gray-700">Servicios</h4>
                    <div className="overflow-auto border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 font-semibold">
                                <tr>
                                    <th className="p-3">Nombre del servicio</th>
                                    <th className="p-3 text-center">Imagen</th>
                                    <th className="p-3 text-center">Cant.</th>
                                    <th className="p-3 text-right">Precio del servicio</th>
                                    <th className="p-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {serviceItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-400">
                                            No hay servicios agregados
                                        </td>
                                    </tr>
                                ) : (
                                    serviceItems.map((detail: ISaleDetail) => (
                                        <tr key={detail.saledetailid} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="font-medium text-gray-800">
                                                    {detail.service?.name || "Servicio"}
                                                </div>
                                                {detail.notes ? (
                                                    <div className="text-xs text-gray-400">{detail.notes}</div>
                                                ) : null}
                                            </td>
                                            <td className="p-3 text-center">
                                                {detail.service?.image ? (
                                                    <img
                                                        src={detail.service.image}
                                                        alt={detail.service?.name || "Servicio"}
                                                        className="w-8 h-8 rounded object-cover mx-auto border"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded bg-gray-200 mx-auto flex items-center justify-center text-xs text-gray-500">
                                                        N/A
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">{detail.quantity}</td>
                                            <td className="p-3 text-right">{formatCurrency(detail.unitprice)}</td>
                                            <td className="p-3 text-right font-semibold">{formatCurrency(detail.linetotal)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {sale.notes ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-700 mb-2">Observaciones</h4>
                    <p className="text-gray-600 italic">&quot; {sale.notes} &quot;</p>
                </div>
            ) : null}
        </div>
    );
}
