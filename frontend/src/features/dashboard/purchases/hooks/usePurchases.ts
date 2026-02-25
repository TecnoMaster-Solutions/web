"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPurchases,
  createPurchase,
  cancelPurchase,
  getProductsForPurchase,
  getSuppliersForPurchase,
} from "../api/purchases.api";
import { IPurchase } from "../Types/Purchase.type";

export interface PurchaseFormState {
  orderNumber: string;
  invoiceNumber: string;
  supplier: string;
  registerDate: string;
  amount: number;
  status: string;
  description: string;
}

export const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type CartItem = {
  isNew: boolean;
  productid?: number;
  productname?: string;
  description?: string;
  productpriceofsupplier?: number; // precio del proveedor (compra)
  saleprice?: number; // precio de venta opcional
  quantity: number;
  unitprice: number; // precio unitario de compra
};

let CACHE: IPurchase[] | null = null;

export function usePurchases() {
  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [cancelLoading, setCancelLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string>("");

  const [form, setForm] = useState<PurchaseFormState>({
    orderNumber: "",
    invoiceNumber: "",
    supplier: "",
    registerDate: "",
    amount: 0,
    status: "Aprobado",
    description: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 6 }, (_, i) => currentYear - i),
    [currentYear]
  );

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.unitprice, 0),
    [cart]
  );

  const abortRef = useRef<AbortController | null>(null);

  const generateNextOrderNumber = (data: IPurchase[]) => {
    const year = new Date().getFullYear();
    const currentYearOrders = data
      .map((p) => p.numberoforder || (p as any).orderNumber)
      .filter((n) => n?.includes(`ORD-${year}-`));

    if (currentYearOrders.length === 0) return `ORD-${year}-001`;

    const maxConsecutive = Math.max(
      ...currentYearOrders.map((o) => parseInt(o.split("-")[2], 10))
    );
    const nextConsecutive = (maxConsecutive + 1).toString().padStart(3, "0");
    return `ORD-${year}-${nextConsecutive}`;
  };

  const fetchPurchases = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await getPurchases(controller.signal);
      CACHE = data;
      setPurchases(data);

      const nextOrder = generateNextOrderNumber(data);
      setForm((prev) => ({ ...prev, orderNumber: nextOrder }));
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching purchases:", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar productos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProductsForPurchase();
        setProducts(data);
      } catch (err) {
        console.error("Error cargando productos", err);
      }
    };

    fetchProducts();
  }, []);

  // Cargar proveedores
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliersForPurchase();
        const actives = data.filter((s: any) => s.stateid === 1);
        setSuppliers(actives);
      } catch (err) {
        console.error("Error cargando proveedores", err);
      }
    };

    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchPurchases();
    return () => abortRef.current?.abort();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Añadir producto al carrito
   * Soporta:
   * - Producto existente (productid)
   * - Producto nuevo (productname + productpriceofsupplier)
   */
  const handleAddProduct = ({
    isNew,
    productName,
    supplierPrice,
    selectedProduct,
    quantity,
    description,
    salePrice,
  }: {
    isNew: boolean;
    productName: string;
    supplierPrice: number;
    selectedProduct: string;
    quantity: number;
    description: string;
    salePrice?: number;
  }) => {
    if (!isNew) {
      const product = products.find(
        (p) => p.productid === Number(selectedProduct)
      );
      if (!product) return;

      // Validación: duplicados por productid
      const exists = cart.some((c) => c.productid === product.productid);
      if (exists) {
        setError("Este producto ya fue agregado. No se permiten duplicados.");
        return;
      }

      if (quantity <= 0 || supplierPrice <= 0) {
        setError(
          "La cantidad y el precio del proveedor deben ser mayores a cero."
        );
        return;
      }

      if (salePrice && salePrice < supplierPrice) {
        setError(
          "El precio de venta no puede ser menor que el precio del proveedor."
        );
        return;
      }

      setError("");

      setCart((prev) => [
        ...prev,
        {
          isNew: false,
          productid: product.productid,
          quantity,
          unitprice: supplierPrice,
          productpriceofsupplier: supplierPrice,
          saleprice: salePrice,
          description,
        },
      ]);
    } else {
      // Producto nuevo: validar por nombre
      const exists = cart.some(
        (c) => c.productname?.toLowerCase() === productName.trim().toLowerCase()
      );
      if (exists) {
        setError("Este producto ya fue agregado. No se permiten duplicados.");
        return;
      }

      if (!productName.trim() || supplierPrice <= 0 || quantity <= 0) {
        setError(
          "Para crear un producto nuevo debes ingresar nombre, precio proveedor y cantidad válidos."
        );
        return;
      }

      if (salePrice && salePrice < supplierPrice) {
        setError(
          "El precio de venta no puede ser menor que el precio del proveedor."
        );
        return;
      }

      setError("");

      setCart((prev) => [
        ...prev,
        {
          isNew: true,
          productname: productName.trim(),
          productpriceofsupplier: supplierPrice,
          quantity,
          unitprice: supplierPrice,
          saleprice: salePrice,
          description,
        },
      ]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Construye y envía el payload al endpoint /purchasesmanagement
   * adaptado a la documentación del backend.
   */
  const handleAddPurchase = async () => {
    if (cart.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }

    setSaving(true);

    const created = form.registerDate;

    // Backend espera Date -> enviamos ISO string coherente

    const productsPayload = cart.map((item) => {
      const base: any = {
        quantity: item.quantity,
        unitprice: item.unitprice,
        description: item.description || "",
      };

      if (item.productid) {
        base.productid = item.productid;
      }

      if (item.productname) {
        base.productname = item.productname;
      }

      if (item.productpriceofsupplier) {
        base.productpriceofsupplier = item.productpriceofsupplier;
      }

      if (item.saleprice !== undefined) {
        base.saleprice = item.saleprice;
      }

      return base;
    });

    const payload = {
      numberoforder: form.orderNumber || "TEMP-001",
      reference: form.invoiceNumber,
      supplierid: Number(form.supplier),
      observation: form.description || "",
      stateid: 3, // Aprobado
      createdat: created,
      updatedat: new Date().toISOString(),
      products: productsPayload,
    };

    try {
      return await createPurchase(payload);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPurchase = async (id: number, observation?: string) => {
    try {
      setCancelLoading(true);

      // Limpiar cache para forzar actualización fresca
      CACHE = null;

      // Enviar con observación opcional
      await cancelPurchase(id, observation);

      // Volver a cargar compras (solo una vez)
      await fetchPurchases();
    } catch (error) {
      console.error("Error canceling purchase:", error);
      throw error;
    } finally {
      setCancelLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      orderNumber: "",
      invoiceNumber: "",
      supplier: "",
      registerDate: "",
      amount: 0,
      status: "Aprobado",
      description: "",
    });

    setSelectedProduct("");
    setQuantity(1);
    setCart([]);
    setError("");

    if (purchases.length > 0) {
      const nextOrder = generateNextOrderNumber(purchases);
      setForm((prev) => ({ ...prev, orderNumber: nextOrder }));
    }
  };

  return {
    purchases,
    loading,
    saving,

    form,
    setForm,
    error,
    setError,
    resetForm,

    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    cart,
    setCart,
    total,
    removeFromCart,

    products,
    suppliers,
    years,
    cancelLoading,

    handleChange,
    handleAddProduct,
    handleAddPurchase,
    handleCancelPurchase,
    fetchPurchases,
  };
}
