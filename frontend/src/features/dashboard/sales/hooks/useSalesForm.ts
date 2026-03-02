"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    getProducts,
    getCustomers,
    getServices,
    createSale,
} from "../services/sales.service";
import {
    IProduct,
    ICustomer,
    IService,
    ICartItem,
    ICreateSaleDto,
} from "../types/sales.type";
import { showSuccess, showError, showWarning } from "@/shared/utils/notifications";

export const useSalesForm = () => {
    const [products, setProducts] = useState<IProduct[]>([]);
    const [services, setServices] = useState<IService[]>([]);
    const [customers, setCustomers] = useState<ICustomer[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [saleStatus, setSaleStatus] = useState<"Pending" | "Completed" | "Cancelled">("Pending");

    const TAX_PERCENT = 19;
    const [notes, setNotes] = useState("");
    const [cart, setCart] = useState<ICartItem[]>([]);

    const reloadData = useCallback(async () => {
        setLoadingData(true);
        try {
            const [pData, sData, cData] = await Promise.all([
                getProducts(),
                getServices(),
                getCustomers(),
            ]);
            setProducts(pData);
            setServices(sData.data);
            setCustomers(cData);
        } catch (err) {
            console.error(err);
            showError("Error al cargar datos del formulario.");
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        reloadData();
    }, [reloadData]);

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.linetotal, 0),
        [cart]
    );

    const discountTotal = useMemo(() => {
        return cart.reduce((sum, item) => {
            const lineBase = item.quantity * item.unitprice;
            return sum + (item.discountpercent > 0 ? (lineBase * item.discountpercent) / 100 : 0);
        }, 0);
    }, [cart]);

    const taxAmount = useMemo(
        () => Math.round((subtotal - discountTotal) * (TAX_PERCENT / 100)),
        [subtotal, discountTotal]
    );

    const totalAmount = subtotal - discountTotal + taxAmount;

    const addProductToCart = useCallback((product: IProduct, qty: number) => {
        if (qty <= 0) return;

        const existingItem = cart.find(
            (item) => item.type === "Producto" && item.productid === product.productid
        );

        const currentQty = existingItem ? existingItem.quantity : 0;

        if (currentQty + qty > product.productstock) {
            showWarning(`Stock insuficiente. Disponible: ${product.productstock}`);
            return;
        }

        setCart((prev) => {
            const existing = prev.find(
                (i) => i.type === "Producto" && i.productid === product.productid
            );

            const price = product.productpriceofsale || 0;

            if (existing) {
                const newQty = existing.quantity + qty;
                return prev.map((i) =>
                    i.id === existing.id
                        ? { ...i, quantity: newQty, linetotal: newQty * price }
                        : i
                );
            }

            return [
                ...prev,
                {
                    id: `prod-${product.productid}`,
                    type: "Producto",
                    productid: product.productid,
                    name: product.productname,
                    category: product.category?.name || "Sin Categoría",
                    image: product.image,
                    quantity: qty,
                    unitprice: price,
                    discountpercent: 0,
                    stock: product.productstock,
                    linetotal: qty * price,
                },
            ];
        });

        showSuccess("Producto agregado");
    }, [cart]);

    const addServiceToCart = useCallback((service: IService, price: number) => {
        if (price <= 0) {
            showWarning("El precio del servicio debe ser mayor a 0");
            return;
        }

        setCart((prev) => [
            ...prev,
            {
                id: `serv-${service.serviceid}-${Date.now()}`,
                type: "Servicio",
                serviceid: service.serviceid,
                name: service.name,
                category: service.typeofservicename || "Servicio",
                image: service.image,
                quantity: 1,
                unitprice: price,
                discountpercent: 0,
                stock: 9999,
                linetotal: price,
            },
        ]);

        showSuccess("Servicio agregado");
    }, []);

    const removeFromCart = useCallback((itemId: string) => {
        setCart((prev) => prev.filter((i) => i.id !== itemId));
    }, []);

    const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
        const nextQuantity = Math.max(1, Math.floor(quantity || 1));

        setCart((prev) => {
            const currentItem = prev.find((item) => item.id === itemId);
            if (!currentItem) return prev;

            if (currentItem.type === "Producto" && nextQuantity > currentItem.stock) {
                showWarning(`Stock insuficiente. Disponible: ${currentItem.stock}`);
                return prev;
            }

            return prev.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        quantity: nextQuantity,
                        linetotal: nextQuantity * item.unitprice,
                    }
                    : item
            );
        });
    }, []);

    const updateCartUnitPrice = useCallback((itemId: string, unitprice: number) => {
        const nextUnitPrice = Math.max(0, Number(unitprice || 0));

        setCart((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        unitprice: nextUnitPrice,
                        linetotal: item.quantity * nextUnitPrice,
                    }
                    : item
            )
        );
    }, []);

    const generateSaleCode = () => `VEN-${Date.now()}`;

    const handleSubmit = useCallback(async () => {
        if (!selectedCustomerId) {
            showWarning("Seleccione un cliente.");
            return null;
        }

        if (cart.length === 0) {
            showWarning("El carrito está vacío.");
            return null;
        }

        setSubmitting(true);

        try {
            const saleDto: ICreateSaleDto = {
                salecode: generateSaleCode(),
                saledate: new Date().toISOString(),
                customerid: Number(selectedCustomerId),
                subtotal,
                taxamount: taxAmount,
                discountamount: discountTotal,
                totalamount: totalAmount,
                paymentmethod: paymentMethod,
                salestatus: saleStatus || "Pending",
                notes,
                details: cart.map((item) => ({
                    productid: item.productid,
                    serviceid: item.serviceid,
                    quantity: item.quantity,
                    unitprice: item.unitprice,
                    discountpercent: item.discountpercent,
                })),
            };

            const created = await createSale(saleDto);
            showSuccess("Venta registrada exitosamente");
            return created;
        } catch (err) {
            console.error(err);
            showError("Error al guardar la venta");
            return null;
        } finally {
            setSubmitting(false);
        }
    }, [
        selectedCustomerId,
        cart,
        subtotal,
        totalAmount,
        taxAmount,
        discountTotal,
        paymentMethod,
        notes,
        saleStatus,
    ]);

    return {
        products,
        services,
        customers,
        loadingData,
        selectedCustomerId,
        setSelectedCustomerId,
        saleStatus,
        setSaleStatus,
        paymentMethod,
        setPaymentMethod,
        notes,
        setNotes,
        cart,
        addProductToCart,
        addServiceToCart,
        updateCartQuantity,
        updateCartUnitPrice,
        removeFromCart,
        subtotal,
        discountTotal,
        taxAmount,
        totalAmount,
        TAX_PERCENT,
        handleSubmit,
        submitting,
        reloadData,
    };
};
