"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSalesForm } from "../hooks/useSalesForm";
import Colors from "@/shared/theme/colors";
import { Loader } from "@/shared/components/loader";
import { showError } from "@/shared/utils/notifications";
import { ICustomer, IProduct, IService } from "../types/sales.type";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Import new modals
import CreateProductModal from "./CreateProductModal";

interface CreateSaleFormProps {
    onClose: () => void;
    onSaved: () => void;
}

type FormErrors = {
    customer?: string;
    paymentMethod?: string;
    cart?: string;
};

function normalizeText(value: string) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function initials(name: string) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (a + b).toUpperCase() || "C";
}

function getCustomerLabel(customer: ICustomer) {
    return customer.users
        ? `${customer.users.name} ${customer.users.lastname}`.trim()
        : `Cliente #${customer.customerid}`;
}

function formatCurrencyInput(value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("es-CO");
}

//  Portal Modal Helper 
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
        updateCartQuantity,
        updateCartUnitPrice,
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
        reloadData,
    } = useSalesForm();
    
    //  Selection Modals State 
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

    //  Creation Modals State 
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

    //  Product Selection State 
    const [productSearch, setProductSearch] = useState("");
    const [qty, setQty] = useState(1);

    //  Service Selection State 
    const [serviceSearch, setServiceSearch] = useState("");
    const [servicePrices, setServicePrices] = useState<Record<number, string>>({});
    const [clientQuery, setClientQuery] = useState("");
    const [clientOpen, setClientOpen] = useState(false);
    const [clientActiveIndex, setClientActiveIndex] = useState(0);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const clientBoxRef = useRef<HTMLDivElement>(null);
    const clientInputRef = useRef<HTMLInputElement>(null);

    const selectedCustomer = useMemo(
        () =>
            customers.find((c) => Number(c.customerid) === Number(selectedCustomerId)) ?? null,
        [customers, selectedCustomerId]
    );

    const clientOptions = useMemo(() => {
        const q = normalizeText(clientQuery);
        if (!q) return customers.slice(0, 10);

        const scored = customers
            .map((customer) => {
                const label = normalizeText(getCustomerLabel(customer));
                const email = normalizeText(customer.users?.email ?? "");
                const document = normalizeText(customer.users?.documentnumber ?? "");
                const idText = String(customer.customerid);
                let score = 0;

                if (idText.startsWith(q)) score += 4;
                if (document.startsWith(q)) score += 4;
                if (label.includes(q)) score += 2;
                if (label.startsWith(q)) score += 1;
                if (email.includes(q)) score += 1;

                return { customer, score };
            })
            .filter((item) => item.score > 0)
            .sort(
                (a, b) =>
                    b.score - a.score ||
                    a.customer.customerid - b.customer.customerid
            );

        return scored.slice(0, 10).map((item) => item.customer);
    }, [customers, clientQuery]);

    const pickClient = (customerId: number) => {
        if (!Number.isFinite(customerId) || customerId <= 0) return;
        setSelectedCustomerId(customerId);
        setFormErrors((prev) => ({ ...prev, customer: undefined }));
        setClientQuery("");
        setClientOpen(false);
    };

    const clearClient = () => {
        setSelectedCustomerId("");
        setClientQuery("");
        setClientOpen(false);
        clientInputRef.current?.focus();
    };

    useEffect(() => {
        setClientActiveIndex(0);
    }, [clientQuery, clientOpen]);

    useEffect(() => {
        if (!clientOpen) return;
        const onMouseDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!clientBoxRef.current?.contains(target)) {
                setClientOpen(false);
            }
        };
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, [clientOpen]);

    useEffect(() => {
        if (selectedCustomerId === "") return;
        if (!customers.some((c) => Number(c.customerid) === Number(selectedCustomerId))) {
            setSelectedCustomerId("");
        }
    }, [customers, selectedCustomerId, setSelectedCustomerId]);

    useEffect(() => {
        if (cart.length > 0) {
            setFormErrors((prev) => ({ ...prev, cart: undefined }));
        }
    }, [cart.length]);

    //  Filter Products 
    const filteredProducts = useMemo(() => {
        const term = productSearch.toLowerCase();
        return products.filter(
            (p) =>
                p.isactive &&
                (p.productname.toLowerCase().includes(term) ||
                    (p.productcode && p.productcode.toLowerCase().includes(term)))
        );
    }, [products, productSearch]);

    //  Filter Services 
    const filteredServices = useMemo(() => {
        const term = serviceSearch.toLowerCase();
        return services.filter(
            (s) =>
                s.name.toLowerCase().includes(term) ||
                (s.description || "").toLowerCase().includes(term)
        );
    }, [services, serviceSearch]);

    const productItems = useMemo(
        () => cart.filter((item) => item.type === "Producto"),
        [cart]
    );

    const serviceItems = useMemo(
        () => cart.filter((item) => item.type === "Servicio"),
        [cart]
    );

    //  Handlers 
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
        setServicePrices((prev) => ({
            ...prev,
            [s.serviceid]: "",
        }));
        setIsServiceModalOpen(false);
    };

    const validateForm = () => {
        const nextErrors: FormErrors = {};

        if (!selectedCustomerId) {
            nextErrors.customer = "Debe seleccionar un cliente.";
        }

        if (!String(paymentMethod ?? "").trim()) {
            nextErrors.paymentMethod = "Debe seleccionar un metodo de pago.";
        }

        if (cart.length === 0) {
            nextErrors.cart = "Debe agregar al menos un producto o servicio.";
        }

        setFormErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            showError("Por favor llene los campos.");
            return;
        }

        const sale = await handleSubmit();
        if (sale) {
            onSaved();
            onClose();
        }
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
                        <p className="text-sm text-gray-500">Registre una nueva venta complete los datos y guarde</p>
                    </div>
                </div>

                {/* botón derecho 'Volver' removido */}
            </div>

            <div className="flex flex-col items-start gap-6 md:flex-row p-2">
                {/*  Left Column: Form & Details (65%)  */}
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
                                {selectedCustomer ? (
                                    <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-700">
                                                {initials(getCustomerLabel(selectedCustomer))}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-900">
                                                    {getCustomerLabel(selectedCustomer)}
                                                </p>
                                                <p className="truncate text-[11px] text-gray-500">
                                                    Cliente #{selectedCustomer.customerid}
                                                    {selectedCustomer.users?.documentnumber
                                                        ? ` - Doc ${selectedCustomer.users.documentnumber}`
                                                        : selectedCustomer.users?.email
                                                            ? ` - ${selectedCustomer.users.email}`
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearClient}
                                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                ) : null}

                                <div className="relative" ref={clientBoxRef}>
                                    <input
                                        ref={clientInputRef}
                                        value={clientQuery}
                                        onChange={(e) => {
                                            setClientQuery(e.target.value);
                                            setClientOpen(true);
                                        }}
                                        onFocus={() => setClientOpen(true)}
                                        onKeyDown={(e) => {
                                            if (!clientOpen) return;
                                            if (e.key === "ArrowDown") {
                                                e.preventDefault();
                                                setClientActiveIndex((i) =>
                                                    Math.min(i + 1, Math.max(0, clientOptions.length - 1))
                                                );
                                            } else if (e.key === "ArrowUp") {
                                                e.preventDefault();
                                                setClientActiveIndex((i) => Math.max(i - 1, 0));
                                            } else if (e.key === "Enter") {
                                                if (clientOptions[clientActiveIndex]) {
                                                    e.preventDefault();
                                                    pickClient(clientOptions[clientActiveIndex].customerid);
                                                }
                                            } else if (e.key === "Escape") {
                                                setClientOpen(false);
                                            }
                                        }}
                                        placeholder={
                                            loadingData
                                                ? "Cargando clientes..."
                                                : customers.length
                                                    ? "Buscar por nombre, documento o id"
                                                    : "No hay clientes"
                                        }
                                        disabled={loadingData || customers.length === 0}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"
                                        style={{ borderColor: Colors.table.lines }}
                                        aria-expanded={clientOpen}
                                        aria-controls="sale-client-suggest"
                                        aria-autocomplete="list"
                                    />

                                    {clientOpen && !loadingData && (
                                        <div
                                            id="sale-client-suggest"
                                            className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                                        >
                                            {clientOptions.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-gray-500">
                                                    No hay coincidencias.
                                                </div>
                                            ) : (
                                                <ul className="max-h-56 overflow-auto">
                                                    {clientOptions.map((customer, idx) => (
                                                        <li key={customer.customerid}>
                                                            <button
                                                                type="button"
                                                                onMouseDown={(ev) => ev.preventDefault()}
                                                                onClick={() => pickClient(customer.customerid)}
                                                                onMouseEnter={() => setClientActiveIndex(idx)}
                                                                className={[
                                                                    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm",
                                                                    idx === clientActiveIndex ? "bg-gray-100" : "bg-white",
                                                                ].join(" ")}
                                                            >
                                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-gray-50 text-[11px] font-semibold text-gray-700">
                                                                    {initials(getCustomerLabel(customer))}
                                                                </span>
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block truncate font-medium text-gray-900">
                                                                        {getCustomerLabel(customer)}
                                                                    </span>
                                                                    <span className="block truncate text-[11px] text-gray-500">
                                                                        Cliente #{customer.customerid}
                                                                        {customer.users?.documentnumber
                                                                            ? ` - Doc ${customer.users.documentnumber}`
                                                                            : customer.users?.email
                                                                                ? ` - ${customer.users.email}`
                                                                            : ""}
                                                                    </span>
                                                                </span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {formErrors.customer ? (
                                    <p className="mt-2 text-sm text-red-600">{formErrors.customer}</p>
                                ) : null}
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

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Método de pago
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => {
                                        setPaymentMethod(e.target.value);
                                        setFormErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                                    }}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    style={{ borderColor: Colors.table.lines }}
                                >
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia</option>
                                </select>
                                {formErrors.paymentMethod ? (
                                    <p className="mt-2 text-sm text-red-600">{formErrors.paymentMethod}</p>
                                ) : null}
                            </div>

                        </div>
                    </div>

                    {/* Card: Detalles */}
                    <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
                        <h3 className="mb-4 text-lg font-bold" style={{ color: Colors.texts.primary }}>
                            Detalles de Productos y Servicios
                        </h3>

                        <div className="mb-4 space-y-4">
                            <div>
                                <h4 className="mb-2 text-sm font-semibold text-gray-700">
                                    Productos
                                </h4>
                                <div className="overflow-auto border rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600 font-semibold">
                                            <tr>
                                                <th className="p-3">Nombre del producto</th>
                                                <th className="p-3">Categoría</th>
                                                <th className="p-3 text-center">Imagen</th>
                                                <th className="p-3 text-center">Cant.</th>
                                                <th className="p-3 text-right">Precio por unidad</th>
                                                <th className="p-3 text-right">Total</th>
                                                <th className="p-3 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {productItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="p-6 text-center text-gray-400">
                                                        No hay productos agregados
                                                    </td>
                                                </tr>
                                            ) : (
                                                productItems.map((item) => (
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
                                                        <td className="p-3 text-center">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.stock}
                                                                value={item.quantity}
                                                                onChange={(e) =>
                                                                    updateCartQuantity(item.id, Number(e.target.value))
                                                                }
                                                                className="mx-auto w-20 rounded-md border border-gray-300 px-2 py-1 text-center outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            ${item.unitprice.toLocaleString("es-CO")}
                                                        </td>
                                                        <td className="p-3 text-right font-semibold">
                                                            ${item.linetotal.toLocaleString("es-CO")}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="text-green-500 hover:text-green-700 transition"
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
                            </div>

                            <div>
                                <h4 className="mb-2 text-sm font-semibold text-gray-700">
                                    Servicios
                                </h4>
                                <div className="overflow-auto border rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600 font-semibold">
                                            <tr>
                                                <th className="p-3">Nombre del servicio</th>
                                                <th className="p-3 text-center">Imagen</th>
                                                <th className="p-3 text-right">Precio del servicio</th>
                                                <th className="p-3 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {serviceItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-6 text-center text-gray-400">
                                                        No hay servicios agregados
                                                    </td>
                                                </tr>
                                            ) : (
                                                serviceItems.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="p-3 font-medium text-gray-800">{item.name}</td>
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
                                                        <td className="p-3 text-right">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={item.unitprice ? formatCurrencyInput(String(item.unitprice)) : ""}
                                                                onChange={(e) => {
                                                                    const rawValue = e.target.value.replace(/\D/g, "");
                                                                    updateCartUnitPrice(item.id, Number(rawValue || 0));
                                                                }}
                                                                className="ml-auto w-28 rounded-md border border-gray-300 px-2 py-1 text-right outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="text-green-500 hover:text-green-700 transition"
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
                            </div>
                        </div>

                        {/* Table */}
                        <div className="hidden flex-1 overflow-auto border rounded-lg mb-4">
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
                                                <td className="p-3 text-gray-500">
                                                    {item.type === "Producto" ? item.category : ""}
                                                </td>
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
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.type === "Producto" ? item.stock : undefined}
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateCartQuantity(item.id, Number(e.target.value))
                                                        }
                                                        className="mx-auto w-20 rounded-md border border-gray-300 px-2 py-1 text-center outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="p-3 text-right">
                                                    ${item.unitprice.toLocaleString("es-CO")}
                                                </td>
                                                <td className="p-3 text-right font-semibold">
                                                    ${item.linetotal.toLocaleString("es-CO")}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-green-500 hover:text-green-700 transition"
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
                        {formErrors.cart ? (
                            <p className="mb-3 text-sm text-red-600">{formErrors.cart}</p>
                        ) : null}
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

                {/*  Right Column: Totals & Actions (35%)  */}
                <div className="w-full md:w-[35%] flex flex-col gap-6">
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
                                onClick={handleSave}
                                disabled={submitting}
                                className="px-6 py-2 rounded-lg font-medium text-white transition flex items-center justify-center"
                                style={{ backgroundColor: "black" }}
                            >
                                {submitting ? <Loader size="sm" /> : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>

                {/*  Product Selection Modal  */}
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
                                                    <span className={p.productstock === 0 ? "text-green-500 font-bold" : "text-gray-700"}>
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

                {/*  CREATE Product Modal (New)  */}
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


                {/*  Service Selection Modal  */}
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
                                                    type="text"
                                                    placeholder="0"
                                                    className="w-20 p-1 border rounded text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                    value={servicePrices[s.serviceid] ?? ""}
                                                    onChange={(e) => {
                                                        setServicePrices((prev) => ({
                                                            ...prev,
                                                            [s.serviceid]: formatCurrencyInput(e.target.value),
                                                        }));
                                                    }}
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const rawPrice = (servicePrices[s.serviceid] ?? "").replace(/\D/g, "");
                                                        const price = Number(rawPrice);
                                                        if (price) {
                                                            handleAddService(s, Number(price));
                                                            setServicePrices((prev) => ({
                                                                ...prev,
                                                                [s.serviceid]: "",
                                                            }));
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

                {/*  CREATE Service Modal (New)  */}
            </div>
        </>
    );
}
