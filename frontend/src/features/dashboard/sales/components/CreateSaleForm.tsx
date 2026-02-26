"use client";

import { useState, useMemo } from "react";
import { useSalesForm } from "../hooks/useSalesForm";
import Colors from "@/shared/theme/colors";
import { Loader } from "@/shared/components/loader";
import { IProduct, IService } from "../types/sales.type";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Import new modals
import CreateProductModal from "./CreateProductModal";
import CreateServiceModal from "./CreateServiceModal";

interface CreateSaleFormProps {
    onClose: () => void;
    onSaved: () => void;
}

// ── Portal Modal Helper ──
const PortalModal = ({
    isOpen,
    onClose,
    title,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) => {
    if (!isOpen) return null;
    if (!isOpen) return null;
    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
                >
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-bold" style={{ color: Colors.texts.primary }}>
                            {title}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>
                    <div className="p-4 max-h-[85vh] overflow-y-auto">{children}</div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default function CreateSaleForm({ onClose, onSaved }: CreateSaleFormProps) {
    const {
        products,
        services,
        customers,
        loadingData,
        cart,
        addProductToCart,
        addServiceToCart,
        removeFromCart,
        subtotal,
        taxAmount,
        discountTotal,
        totalAmount,
        selectedCustomerId,
        setSelectedCustomerId,
        paymentMethod,
        setPaymentMethod,
        notes,
        setNotes,
        handleSubmit,
        submitting,
        TAX_PERCENT,
        reloadData // Reload data after creation
        ,
        saleStatus,
        setSaleStatus,
        paymentStatus,
        setPaymentStatus,
    } = useSalesForm(() => {
         onSaved();
         onClose();
     });
    
    // ── Selection Modals State ──
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

    // ── Creation Modals State ──
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
    const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);

    // ── Product Selection State ──
    const [productSearch, setProductSearch] = useState("");
    const [qty, setQty] = useState(1);

    // ── Service Selection State ──
    const [serviceSearch, setServiceSearch] = useState("");
    const [servicePrice, setServicePrice] = useState<number | "">("");

    // ── Filter Products ──
    const filteredProducts = useMemo(() => {
        const term = productSearch.toLowerCase();
        return products.filter(
            (p) =>
                p.isactive &&
                (p.productname.toLowerCase().includes(term) ||
                    (p.productcode && p.productcode.toLowerCase().includes(term)))
        );
    }, [products, productSearch]);

    // ── Filter Services ──
    const filteredServices = useMemo(() => {
        const term = serviceSearch.toLowerCase();
        return services.filter(
            (s) =>
                s.name.toLowerCase().includes(term) ||
                (s.description || "").toLowerCase().includes(term)
        );
    }, [services, serviceSearch]);

    // ── Handlers ──
    const handleAddProduct = (p: IProduct) => {
        addProductToCart(p, qty);
        setQty(1);
        setIsProductModalOpen(false);
    };

    const handleAddService = (s: IService, price: number) => {
        if (!price || price <= 0) {
            alert("Ingrese un precio válido para el servicio");
            return;
        }
        addServiceToCart(s, price);
        setServicePrice("");
        setIsServiceModalOpen(false);
    };

    // Nota: ya no mostramos loader global; renderizamos la vista aunque loadingData sea true

    return (
        <>
            {/* Barra superior: flecha + título grande + botón Volver */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        aria-label="Volver"
                        title="Volver"
                        className="p-2 rounded-md hover:bg-gray-100 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>

                    <div>
                        <h1 className="text-3xl font-extrabold" style={{ color: Colors.texts.primary }}>
                            Crear Venta
                        </h1>
                        <p className="text-sm text-gray-500">Registre una nueva venta — complete los datos y guarde</p>
                    </div>
                </div>

                {/* botón derecho 'Volver' removido */}
            </div>

            <div className="flex flex-col gap-6 md:flex-row h-full max-h-[calc(100vh-160px)] overflow-y-auto p-2">
                {/* ── Left Column: Form & Details (65%) ── */}
                <div className="md:w-[65%] flex flex-col gap-6">

                    {/* Card: Datos de Venta */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold" style={{ color: Colors.texts.primary }}>
                            Datos de la Venta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Cliente */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Cliente
                                </label>
                                <select
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    style={{ borderColor: Colors.table.lines }}
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                                >
                                    <option value="">-- Seleccionar Cliente --</option>
                                    {customers.map((c) => (
                                        <option key={c.customerid} value={c.customerid}>
                                            {c.users
                                                ? `${c.users.name} ${c.users.lastname}`
                                                : `Cliente #${c.customerid}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fecha (Readonly) */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Fecha Venta
                                </label>
                                <input
                                    type="date"
                                    disabled
                                    value={new Date().toISOString().split("T")[0]}
                                    className="w-full p-2 border rounded-lg bg-gray-50 text-gray-500"
                                />
                            </div>

                            {/* Estado Venta (editable) */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Estado Venta
                                </label>
                                <select
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={saleStatus}
                                    onChange={(e) => setSaleStatus(e.target.value as any)}
                                >
                                    <option value="Pending">Pendiente</option>
                                
                                </select>
                            </div>

                            
                        </div>
                    </div>

                    {/* Card: Detalles */}
                    <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
                        <h3 className="mb-4 text-lg font-bold" style={{ color: Colors.texts.primary }}>
                            Detalles de Productos y Servicios
                        </h3>

                        {/* Table */}
                        <div className="flex-1 overflow-auto border rounded-lg mb-4">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 font-semibold sticky top-0">
                                    <tr>
                                        <th className="p-3">Productos/Servicios</th>
                                        <th className="p-3">Categoría</th>
                                        <th className="p-3 text-center">Imagen</th>
                                        <th className="p-3 text-center">Cant.</th>
                                        <th className="p-3 text-right">Precio</th>
                                        <th className="p-3 text-right">Total</th>
                                        <th className="p-3 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {cart.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-400">
                                                No hay ítems agregados
                                            </td>
                                        </tr>
                                    ) : (
                                        cart.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium text-gray-800">{item.name}</td>
                                                <td className="p-3 text-gray-500">{item.category}</td>
                                                <td className="p-3 text-center">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt=""
                                                            className="w-8 h-8 rounded object-cover mx-auto border"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded bg-gray-200 mx-auto flex items-center justify-center text-xs text-gray-500">
                                                            N/A
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">{item.quantity}</td>
                                                <td className="p-3 text-right">
                                                    ${item.unitprice.toLocaleString("es-CO")}
                                                </td>
                                                <td className="p-3 text-right font-semibold">
                                                    ${item.linetotal.toLocaleString("es-CO")}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-red-500 hover:text-red-700 transition"
                                                        title="Eliminar"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsProductModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:brightness-95"
                                style={{ backgroundColor: "#F3F4F6", color: Colors.texts.secondary }}
                            >
                                <span>+</span> Agregar Producto
                            </button>
                            <button
                                onClick={() => setIsServiceModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:brightness-95"
                                style={{ backgroundColor: "#F3F4F6", color: Colors.texts.secondary }}
                            >
                                <span>+</span> Agregar Servicio
                            </button>
                        </div>
                    </div>

                    {/* Observations */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Observaciones
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Ingrese su observación (opcional)"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            style={{ borderColor: Colors.table.lines }}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* ── Right Column: Totals & Actions (35%) ── */}
                <div className="md:w-[35%] flex flex-col gap-6">
                    {/* Totals Card */}
                    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm sticky top-4">
                        <h3 className="text-2xl font-bold mb-6" style={{ color: Colors.texts.primary }}>
                            Total
                        </h3>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-gray-900">
                                    ${subtotal.toLocaleString("es-CO")}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>IVA ({TAX_PERCENT}%)</span>
                                <span className="font-medium text-gray-900">
                                    ${taxAmount.toLocaleString("es-CO")}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Descuento</span>
                                <span className="font-medium text-gray-900">
                                    ${discountTotal.toLocaleString("es-CO")}
                                </span>
                            </div>

                            <div className="h-px bg-gray-200 my-4" />

                            <div className="flex justify-between text-lg font-bold">
                                <span style={{ color: Colors.texts.primary }}>Total </span>
                                <span style={{ color: Colors.texts.primary }}>
                                    ${totalAmount.toLocaleString("es-CO")}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 justify-start">
                            <button
                                onClick={onClose}
                                disabled={submitting}
                                className="px-6 py-2 rounded-lg font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-6 py-2 rounded-lg font-medium text-white transition flex items-center justify-center"
                                style={{ backgroundColor: "black" }}
                            >
                                {submitting ? <Loader size="sm" /> : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Product Selection Modal ── */}
                <PortalModal
                    isOpen={isProductModalOpen}
                    onClose={() => setIsProductModalOpen(false)}
                    title="Agregar Producto"
                >
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre o código..."
                                className="w-full p-2 border rounded-lg"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                autoFocus
                            />
                            
                        </div>

                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                            {filteredProducts.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No se encontraron productos</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                        <tr>
                                            <th className="p-2">Producto</th>
                                            <th className="p-2 text-right">Stock</th>
                                            <th className="p-2 text-right">Precio</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredProducts.map(p => (
                                            <tr key={p.productid} className="hover:bg-gray-50">
                                                <td className="p-2">
                                                    <div className="font-medium">{p.productname}</div>
                                                    <div className="text-xs text-gray-500">{p.productcode}</div>
                                                </td>
                                                <td className="p-2 text-right">
                                                    <span className={p.productstock === 0 ? "text-red-500 font-bold" : "text-gray-700"}>
                                                        {p.productstock}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-right">
                                                    ${(p.productpriceofsale || 0).toLocaleString("es-CO")}
                                                </td>
                                                <td className="p-2 text-right">
                                                    <button
                                                        onClick={() => handleAddProduct(p)}
                                                        disabled={p.productstock === 0}
                                                        className="px-3 py-1 bg-black text-white rounded text-xs hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Agregar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm font-medium">Cantidad a agregar:</span>
                            <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => setQty(Number(e.target.value))}
                                className="w-20 p-2 border rounded text-center"
                            />
                        </div>
                    </div>
                </PortalModal>

                {/* ── CREATE Product Modal (New) ── */}
                <PortalModal
                    isOpen={isNewProductModalOpen}
                    onClose={() => setIsNewProductModalOpen(false)}
                    title="Crear Producto"
                >
                    <CreateProductModal
                        onClose={() => setIsNewProductModalOpen(false)}
                        onSaved={() => {
                            reloadData();
                            setIsNewProductModalOpen(false);
                            setIsProductModalOpen(true);
                        }}
                    />
                </PortalModal>


                {/* ── Service Selection Modal ── */}
                <PortalModal
                    isOpen={isServiceModalOpen}
                    onClose={() => setIsServiceModalOpen(false)}
                    title="Agregar Servicio"
                >
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Buscar servicio..."
                                className="w-full p-2 border rounded-lg"
                                value={serviceSearch}
                                onChange={(e) => setServiceSearch(e.target.value)}
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setIsServiceModalOpen(false);
                                    setIsNewServiceModalOpen(true);
                                }}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg whitespace-nowrap hover:bg-green-700 text-sm font-medium"
                                title="Crear nuevo servicio"
                            >
                                + Crear Nuevo
                            </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                            {filteredServices.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No se encontraron servicios</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 p-2">
                                    {filteredServices.map(s => (
                                        <div
                                            key={s.serviceid}
                                            className="flex items-center gap-3 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                                        >
                                            <img
                                                src={s.image || "https://via.placeholder.com/40"}
                                                className="w-10 h-10 rounded object-cover"
                                                alt=""
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{s.name}</div>
                                                <div className="text-xs text-gray-500">{s.typeofservicename}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs text-gray-500">
                                                    Precio:
                                                </div>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-20 p-1 border rounded text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        setServicePrice(Number(e.target.value));
                                                    }}
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        let price = servicePrice;
                                                        if (!price) {
                                                            const p = prompt("Precio del servicio:");
                                                            if (p) price = Number(p);
                                                        }
                                                        if (price) {
                                                            handleAddService(s, Number(price));
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-black text-white rounded text-xs hover:opacity-80"
                                                >
                                                    Agregar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </PortalModal>

                {/* ── CREATE Service Modal (New) ── */}
                <PortalModal
                    isOpen={isNewServiceModalOpen}
                    onClose={() => setIsNewServiceModalOpen(false)}
                    title="Crear Servicio"
                >
                    <CreateServiceModal
                        onClose={() => setIsNewServiceModalOpen(false)}
                        onSaved={() => {
                            reloadData();
                            setIsNewServiceModalOpen(false);
                            setIsServiceModalOpen(true);
                        }}
                    />
                </PortalModal>

            </div>
        </>
    );
}