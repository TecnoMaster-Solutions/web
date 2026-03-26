"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPurchases,
  createPurchase,
  cancelPurchase,
  getProductsForPurchase,
  getSuppliersForPurchase,
  getPurchaseOrdersForSupplier,
  getPurchaseOrderById,
} from "../api/purchases.api";
import { IPurchase, IPurchaseOrder } from "../Types/Purchase.type";

type PurchaseProduct = Awaited<ReturnType<typeof getProductsForPurchase>>;
type PurchaseProductItem = PurchaseProduct extends Array<infer T> ? T : never;
type PurchaseSupplier = Awaited<ReturnType<typeof getSuppliersForPurchase>>;
type PurchaseSupplierItem = PurchaseSupplier extends Array<infer T> ? T : never;
type PurchaseOrderDetailResponse = Awaited<ReturnType<typeof getPurchaseOrderById>>;

type ApiErrorShape = {
  name?: string;
  code?: string;
  response?: { data?: { message?: string } };
  message?: string;
};

type CreatePurchasePayload = {
  numberoforder: string;
  reference: string;
  supplierid: number;
  observation: string;
  stateid: number;
  createdat: string;
  updatedat: string;
  purchaseOrderId?: number;
  purchaseOrderFinalStateId?: number;
  products: Array<
    | {
        productid: number;
        saleprice: number;
      }
    | {
        productid: number;
        quantity: number;
        unitprice: number;
        productpriceofsupplier: number;
        saleprice?: number;
      }
  >;
};

export interface PurchaseFormState {
  orderNumber: string;
  invoiceNumber: string;
  supplier: string;
  registerDate: string;
  amount: number;
  status: string;
  description: string;
  purchaseOrderId: string;
  purchaseOrderFinalStateId: string;
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
  productid: number;
  productname: string;
  quantity: number;
  unitprice: number;
  saleprice?: number;
};

const parseCOP = (input: string): number => {
  const digits = (input ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
};

const onlyDigits = (s: string) => (s ?? "").replace(/[^\d]/g, "");
const hasDigits = (s: string) => onlyDigits(s).length > 0;

const autoSalePrice = (purchaseUnitPrice: number): number => {
  const p = Number(purchaseUnitPrice) || 0;
  if (p <= 0) return 0;
  if (p <= 500000) return p * 2;
  return p + 100000;
};

const toLocalNoonISO = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
};

const PO_PENDING_STATE_ID = 5;
const OC_APROBADA_ID = 6;
const OC_ANULADA_ID = 8;
const COMPRA_APROBADA_ID = 3;
const COMPRA_ANULADA_ID = 8;

export function usePurchases() {
  const [purchases, setPurchases] = useState<IPurchase[]>([]);

  const [loadingCount, setLoadingCount] = useState(0);
  const loading = loadingCount > 0;
  const startLoading = () => setLoadingCount((c) => c + 1);
  const stopLoading = () => setLoadingCount((c) => Math.max(0, c - 1));

  const [tableLoading, setTableLoading] = useState(false);

  const [products, setProducts] = useState<PurchaseProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<PurchaseSupplierItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<IPurchaseOrder[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poDetailLoading, setPoDetailLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [form, setForm] = useState<PurchaseFormState>({
    orderNumber: "",
    invoiceNumber: "",
    supplier: "",
    registerDate: "",
    amount: 0,
    status: "Aprobado",
    description: "",
    purchaseOrderId: "",
    purchaseOrderFinalStateId: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const isUsingPurchaseOrder = !!form.purchaseOrderId;

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.unitprice, 0),
    [cart]
  );

  const abortRef = useRef<AbortController | null>(null);
  const firstLoadRef = useRef(true);

  const generateNextOrderNumber = (data: IPurchase[]) => {
    const year = new Date().getFullYear();
    const currentYearOrders = data
      .map((p) => p.numberoforder)
      .filter((n) => n?.includes(`ORD-${year}-`));

    if (currentYearOrders.length === 0) return `ORD-${year}-001`;

    const maxConsecutive = Math.max(
      ...currentYearOrders.map((o) => parseInt(o.split("-")[2], 10))
    );
    const nextConsecutive = (maxConsecutive + 1).toString().padStart(3, "0");
    return `ORD-${year}-${nextConsecutive}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchPurchases = useCallback(
    async (customPage: number, customLimit: number, customSearch: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (firstLoadRef.current) {
        startLoading();
      } else {
        setTableLoading(true);
      }

      try {
        const response = await getPurchases({
          page: customPage,
          limit: customLimit,
          search: customSearch,
          signal: controller.signal,
        });


        setPurchases(response.data);
        setTotal(Number(response.meta.total ?? 0));

        const nextOrder = generateNextOrderNumber(response.data);
        setForm((prev) =>
          prev.orderNumber === nextOrder
            ? prev
            : { ...prev, orderNumber: nextOrder }
        );
      } catch (error: unknown) {
        const apiError = error as ApiErrorShape | null;
        if (
          apiError?.name !== "AbortError" &&
          apiError?.code !== "ERR_CANCELED" &&
          apiError?.name !== "CanceledError"
        ) {
          console.error("Error fetching purchases:", error);
        }
      } finally {
        if (firstLoadRef.current) {
          stopLoading();
          firstLoadRef.current = false;
        } else {
          setTableLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProductsForPurchase();
        setProducts(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Error cargando productos", err);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliersForPurchase();
        const actives = data.filter((s) => s.stateid === 1);
        setSuppliers(actives);
      } catch (err) {
        console.error("Error cargando proveedores", err);
      }
    };

    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchPurchases(page, limit, debouncedSearch);

    return () => {
      abortRef.current?.abort();
    };
  }, [page, limit, debouncedSearch, fetchPurchases]);

  useEffect(() => {
    const supplierId = Number(form.supplier);

    if (!supplierId) {
      setPurchaseOrders([]);
      setForm((prev) => {
        if (
          prev.purchaseOrderId === "" &&
          prev.purchaseOrderFinalStateId === ""
        ) {
          return prev;
        }

        return {
          ...prev,
          purchaseOrderId: "",
          purchaseOrderFinalStateId: "",
        };
      });
      return;
    }

    (async () => {
      try {
        setPoLoading(true);

        const data = await getPurchaseOrdersForSupplier(
          supplierId,
          PO_PENDING_STATE_ID
        );

        setPurchaseOrders(data);

        setForm((prev) => {
          const stillExists = data.some(
            (po) => String(po.id) === prev.purchaseOrderId
          );

          const nextPurchaseOrderId = stillExists ? prev.purchaseOrderId : "";
          const nextPurchaseOrderFinalStateId = stillExists
            ? prev.purchaseOrderFinalStateId
            : "";

          if (
            prev.purchaseOrderId === nextPurchaseOrderId &&
            prev.purchaseOrderFinalStateId === nextPurchaseOrderFinalStateId
          ) {
            return prev;
          }

          return {
            ...prev,
            purchaseOrderId: nextPurchaseOrderId,
            purchaseOrderFinalStateId: nextPurchaseOrderFinalStateId,
          };
        });
      } catch (err) {
        console.error("Error cargando órdenes de compra", err);
        setPurchaseOrders([]);
      } finally {
        setPoLoading(false);
      }
    })();
  }, [form.supplier]);

  useEffect(() => {
    const poId = Number(form.purchaseOrderId);
    if (!poId) return;

    (async () => {
      try {
        setPoDetailLoading(true);

        const po = await getPurchaseOrderById(poId);
        const detalles = Array.isArray(po?.detalles) ? po.detalles : [];

        if (detalles.length === 0) {
          setCart([]);
          setError("La orden de compra seleccionada no tiene productos.");
          return;
        }

        const newCart: CartItem[] = detalles.map((d: NonNullable<PurchaseOrderDetailResponse["detalles"]>[number]) => {
          const productName =
            d?.producto?.productname ??
            d?.productoNombre ??
            `Producto ${d?.productoId ?? ""}`;

          return {
            productid: Number(d.productoId),
            productname: String(productName),
            quantity: Number(d.cantidad ?? 0),
            unitprice: Number(d.precioUnitario ?? 0),
          };
        });

        setCart(newCart);
        setSelectedProduct("");
        setQuantity(1);
        setPurchasePrice("");
        setSalePrice("");
        setError("");
      } catch (err) {
        console.error("Error cargando detalle de OC", err);
        setCart([]);
        setError("No se pudo cargar el detalle de la Orden de Compra.");
      } finally {
        setPoDetailLoading(false);
      }
    })();
  }, [form.purchaseOrderId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "supplier") {
      setCart([]);
      setSelectedProduct("");
      setQuantity(1);
      setPurchasePrice("");
      setSalePrice("");

      setForm((prev) => ({
        ...prev,
        supplier: value,
        purchaseOrderId: "",
        purchaseOrderFinalStateId: "",
      }));
      setError("");
      return;
    }

    if (name === "purchaseOrderId") {
      setForm((prev) => ({
        ...prev,
        purchaseOrderId: value,
        purchaseOrderFinalStateId: "",
      }));

      if (value) {
        setCart([]);
        setSelectedProduct("");
        setQuantity(1);
        setPurchasePrice("");
        setSalePrice("");
      }

      setError("");
      return;
    }

    if (name === "purchaseOrderFinalStateId") {
      setForm((prev) => ({ ...prev, purchaseOrderFinalStateId: value }));
      setError("");
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addToCart = () => {
    if (isUsingPurchaseOrder) {
      setError(
        "No puedes agregar productos manualmente cuando hay una OC seleccionada."
      );
      return;
    }

    if (!selectedProduct) {
      setError("Selecciona un producto.");
      return;
    }

    const product = products.find((p) => p.productid === Number(selectedProduct));
    if (!product) {
      setError("Producto inválido.");
      return;
    }

    const price = parseCOP(purchasePrice);
    const sPrice = hasDigits(salePrice)
      ? parseCOP(salePrice)
      : autoSalePrice(price);

    if (price <= 0) {
      setError("Ingresa un precio de compra válido.");
      return;
    }

    if (quantity <= 0) {
      setError("La cantidad debe ser mayor que 0.");
      return;
    }

    if (sPrice !== undefined && sPrice < price) {
      setError(
        "El precio de venta no puede ser menor que el precio de compra."
      );
      return;
    }

    const exists = cart.some((c) => c.productid === product.productid);
    if (exists) {
      setError("Este producto ya fue agregado. Edítalo en la lista.");
      return;
    }

    setError("");
    setCart((prev) => [
      ...prev,
      {
        productid: product.productid,
        productname: product.productname,
        quantity,
        unitprice: price,
        saleprice: sPrice,
      },
    ]);

    setSelectedProduct("");
    setPurchasePrice("");
    setSalePrice("");
    setQuantity(1);
  };

  const updateCartItem = (index: number, patch: Partial<CartItem>) => {
    setCart((prev) => {
      const next = [...prev];
      const current = next[index];

      if (!current) return prev;

      if (isUsingPurchaseOrder) {
        const onlySalePricePatch: Partial<CartItem> = {};

        if (patch.saleprice !== undefined) {
          onlySalePricePatch.saleprice = patch.saleprice;
        } else if ("saleprice" in patch) {
          onlySalePricePatch.saleprice = undefined;
        } else {
          return prev;
        }

        next[index] = { ...current, ...onlySalePricePatch };
        return next;
      }

      const merged = { ...current, ...patch };

      if (!Number.isFinite(merged.quantity) || merged.quantity <= 0) {
        return prev;
      }

      if (!Number.isFinite(merged.unitprice) || merged.unitprice < 0) {
        return prev;
      }

      next[index] = merged;
      return next;
    });
  };

  const removeFromCart = (index: number) => {
    if (isUsingPurchaseOrder) {
      setError("Los productos vienen de la OC y no se pueden eliminar aquí.");
      return;
    }

    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPurchase = async () => {
    if (!form.supplier) {
      setError("Selecciona un proveedor.");
      return;
    }

    if (cart.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }

    if (!isUsingPurchaseOrder) {
      for (const item of cart) {
        if (item.saleprice !== undefined && item.saleprice < item.unitprice) {
          setError(
            `El precio de venta del producto ID ${item.productid} no puede ser menor que el precio de compra.`
          );
          return;
        }
      }
    }

    if (isUsingPurchaseOrder) {
      const fs = Number(form.purchaseOrderFinalStateId);

      if (![OC_APROBADA_ID, OC_ANULADA_ID].includes(fs)) {
        setError("Selecciona el estado final de la OC (Aprobada o Anulada).");
        return;
      }
    }

    setSaving(true);

    const created = form.registerDate
      ? toLocalNoonISO(form.registerDate)
      : new Date().toISOString();

    const finalStateNum = Number(form.purchaseOrderFinalStateId || 0);
    const computedPurchaseStateId =
      isUsingPurchaseOrder && finalStateNum === OC_ANULADA_ID
        ? COMPRA_ANULADA_ID
        : COMPRA_APROBADA_ID;

    const payloadBase: Omit<CreatePurchasePayload, "products"> = {
      numberoforder: form.orderNumber || "TEMP-001",
      reference: form.invoiceNumber,
      supplierid: Number(form.supplier),
      observation: form.description || "",
      stateid: computedPurchaseStateId,
      createdat: created,
      updatedat: created,
    };

    const payload = isUsingPurchaseOrder
      ? {
        ...payloadBase,
        purchaseOrderId: Number(form.purchaseOrderId),
        purchaseOrderFinalStateId: Number(form.purchaseOrderFinalStateId),
        products: cart.map((item) => ({
          productid: item.productid,
          saleprice: Number(item.saleprice ?? 0),
        })),
      }
      : {
        ...payloadBase,
        products: cart.map((item) => ({
          productid: item.productid,
          quantity: item.quantity,
          unitprice: item.unitprice,
          productpriceofsupplier: item.unitprice,
          ...(item.saleprice !== undefined
            ? { saleprice: item.saleprice }
            : {}),
        })),
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
      setSaving(true);


      await cancelPurchase(id, observation);
      await fetchPurchases(page, limit, debouncedSearch);
    } catch (error) {
      throw error;
    } finally {
      setCancelLoading(false);
      setSaving(false);
    }
  };

  const resetForm = () => {
    const nextOrder =
      purchases.length > 0 ? generateNextOrderNumber(purchases) : "";

    setForm({
      orderNumber: nextOrder,
      invoiceNumber: "",
      supplier: "",
      registerDate: "",
      amount: 0,
      status: "Aprobado",
      description: "",
      purchaseOrderId: "",
      purchaseOrderFinalStateId: "",
    });

    setSelectedProduct("");
    setQuantity(1);
    setPurchasePrice("");
    setSalePrice("");
    setCart([]);
    setError("");
  };

  return {
    purchases,
    loading,
    tableLoading,
    saving,

    page,
    limit,
    total,
    search,
    setPage,
    setLimit,
    setSearch,

    form,
    setForm,
    error,
    setError,
    resetForm,

    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,

    purchasePrice,
    setPurchasePrice,
    salePrice,
    setSalePrice,

    cart,
    setCart,
    totalAmount,
    removeFromCart,
    updateCartItem,

    products,
    suppliers,

    purchaseOrders,
    poLoading,
    poDetailLoading,

    cancelLoading,

    handleChange,
    addToCart,
    handleAddPurchase,
    handleCancelPurchase,
    fetchPurchases,

    isUsingPurchaseOrder,
  };
}

