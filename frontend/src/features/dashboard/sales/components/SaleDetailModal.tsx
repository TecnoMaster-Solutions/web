"use client";

import { useEffect, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import { ISale, ISaleDetail } from "../types/Sales.type";
import { getSaleById } from "../services/sales.service";

interface SaleDetailModalProps {
    saleId: number | null;
    onClose: () => void;
}

export default function SaleDetailModal({ saleId, onClose }: SaleDetailModalProps) {
    const [sale, setSale] = useState<ISale | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (saleId) {
            setLoading(true);
            setError("");
            getSaleById(saleId)
                .then((data) => {
                    setSale(data);
                })
                .catch((err) => {
                    console.error(err);
                    setError("No se pudo cargar la información de la venta.");
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setSale(null);
        }
    }, [saleId]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Modal
            isOpen={!!saleId}
            onClose={onClose}
            title={undefined}
            hideHeader={true}
            widthClass="max-w-4xl"
        >
            {error ? (
                <div className="text-red-500 p-4 text-center">{error}</div>
            ) : sale ? (
                <div className="space-y-6">
                    {/* Nuevo Header visual: icono + título + subtítulo debajo */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                {/* Icono simple */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                                    <rect x="3" y="7" width="18" height="13" rx="2" ry="2"></rect>
                                    <path d="M16 3v4"></path>
                                    <path d="M8 3v4"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Detalle de Venta</h2>
                            </div>
                        </div>
                        
                    </div>

                    {/* Header Info (dos columnas) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-700 mb-2">Información del Cliente</h4>
                            <p>
                                <span className="font-medium">Nombre:</span>{" "}
                                {sale.customer?.users
                                    ? `${sale.customer.users.name} ${sale.customer.users.lastname}`
                                    : `Cliente #${sale.customerid}`}
                            </p>
                            <p>
                                <span className="font-medium">Ciudad:</span> {sale.customer?.customercity || "N/A"}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-700 mb-2">Datos de la Venta</h4>
                            <p>
                                <span className="font-medium">Número Venta:</span>{" "}
                                {sale.salecode || '-'}
                            </p>
                            <p>
                                <span className="font-medium">Fecha:</span> {formatDate(sale.saledate)}
                            </p>
                            <p>
                                <span className="font-medium">Estado:</span>{" "}
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${sale.salestatus === "Completed"
                                            ? "bg-green-100 text-green-700"
                                            : sale.salestatus === "Pending"
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {sale.salestatus === "Completed" ? "Finalizada"
                                        : sale.salestatus === "Pending" ? "Pendiente"
                                            : sale.salestatus === "Cancelled" ? "Anulada" : sale.salestatus}
                                </span>
                            </p>
                            <p>
                                <span className="font-medium">Creado por:</span> {sale.createdby || "Sistema"}
                            </p>
                        
                        </div>
                    </div>

                    {/* Detalles Table */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                                <rect x="3" y="7" width="18" height="13" rx="2" ry="2"></rect>
                                <path d="M16 3v4"></path>
                                <path d="M8 3v4"></path>
                            </svg>
                            <h4 className="font-bold text-gray-700">Productos / Servicios</h4>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="p-3">Ítem</th>
                                        <th className="p-3 text-center">Cant.</th>
                                        <th className="p-3 text-right">Precio Unit.</th>
                                        <th className="p-3 text-right">Desc.</th>
                                        <th className="p-3 text-right">Total Línea</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sale.salesdetail?.map((detail: ISaleDetail) => (
                                        <tr key={detail.saledetailid} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="font-medium">
                                                    {detail.products?.productname || "Servicio / Ítem"}
                                                </div>
                                                {detail.notes && (
                                                    <div className="text-xs text-gray-400">{detail.notes}</div>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">{detail.quantity}</td>
                                            <td className="p-3 text-right">
                                                ${Number(detail.unitprice).toLocaleString("es-CO")}
                                            </td>
                                            <td className="p-3 text-right">
                                                {detail.discountpercent > 0 ? `${detail.discountpercent}%` : "-"}
                                            </td>
                                            <td className="p-3 text-right font-medium">
                                                ${Number(detail.linetotal).toLocaleString("es-CO")}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!sale.salesdetail || sale.salesdetail.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-gray-400">
                                                Sin detalles registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal:</span>
                                <span>${Number(sale.subtotal).toLocaleString("es-CO")}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Descuento:</span>
                                <span>${Number(sale.discountamount).toLocaleString("es-CO")}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Impuestos:</span>
                                <span>${Number(sale.taxamount).toLocaleString("es-CO")}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-lg text-gray-900">
                                <span>Total:</span>
                                <span>${Number(sale.totalamount).toLocaleString("es-CO")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    {sale.notes && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-700 mb-2">Observaciones</h4>
                            <p className="text-gray-600 italic">
                                " {sale.notes} "
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-80"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}