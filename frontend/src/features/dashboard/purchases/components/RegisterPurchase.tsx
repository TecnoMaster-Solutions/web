"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Colors from "@/shared/theme/colors";
import { IPurchase } from "../Types/Purchase.type";
import { showWarning, showError } from "@/shared/utils/notifications";
import {
  validatePurchaseForm,
  validatePurchaseField,
  type PurchaseErrors,
  type PurchaseFormField,
} from "../validations/purchasesValidations";
import { PurchaseFormState } from "../hooks/usePurchases";
import { IPurchaseOrder } from "../Types/Purchase.type";
import type { PurchaseProductApi, PurchaseSupplierApi } from "../api/purchases.api";

const DEFAULT_SUPPLIER_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/1698/1698535.png";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const parseCOP = (input: string): number => {
  const digits = (input ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
};

const onlyDigits = (s: string) => (s ?? "").replace(/[^\d]/g, "");
const hasDigits = (s: string) => onlyDigits(s).length > 0;

const autoSalePrice = (purchaseUnitPrice: number): number => {
  const p = Number(purchaseUnitPrice) || 0;
  if (p <= 0) return 0;

  const sale = p < 10000 ? p * 2 : p * 1.5;
  return Math.round(sale);
};

const OC_APROBADA_ID = 6;
const OC_ANULADA_ID = 8;

/**
 * Formatea una fecha sin "corrimiento" por zona horaria.
 * - Si viene ISO string: "2026-03-05T12:00:00.000Z" => toma "2026-03-05"
 * - Devuelve "dd/mm/yyyy"
 */
const formatDateOnly = (value: string | Date | null | undefined) => {
  if (!value) return "";

  if (typeof value === "string") {
    const ymd = value.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      const [y, m, d] = ymd.split("-").map(Number);
      return `${d}/${m}/${y}`;
    }
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CO");
};

type CartItem = {
  productid: number;
  productname: string;
  quantity: number;
  unitprice: number;
  saleprice?: number;
};

interface Props {
  onSave: () => Promise<unknown>;
  onClose: (created?: boolean) => void;

  purchases: IPurchase[];
  fetchPurchases: (
    customPage?: number,
    customLimit?: number,
    customSearch?: string
  ) => Promise<void>;
  form: PurchaseFormState;

  selectedProduct: string;
  setSelectedProduct: (value: string) => void;

  quantity: number;
  setQuantity: (value: number) => void;

  purchasePrice: string;
  setPurchasePrice: (value: string) => void;

  salePrice: string;
  setSalePrice: (value: string) => void;

  cart: CartItem[];
  total: number;

  removeFromCart: (index: number) => void;
  updateCartItem: (index: number, patch: Partial<CartItem>) => void;

  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;

  addToCart: () => void;

  products: PurchaseProductApi[];
  suppliers: PurchaseSupplierApi[];

  purchaseOrders: IPurchaseOrder[];
  poLoading: boolean;

  poDetailLoading: boolean;
  isUsingPurchaseOrder: boolean;
}

export default function RegisterPurchaseForm({
  onSave,
  onClose,
  purchases,
  fetchPurchases,
  form,

  selectedProduct,
  setSelectedProduct,

  quantity,
  setQuantity,

  purchasePrice,
  setPurchasePrice,

  salePrice,
  setSalePrice,

  cart,
  total,

  removeFromCart,
  updateCartItem,

  handleChange,
  addToCart,

  products,
  suppliers,

  purchaseOrders,
  poLoading,

  poDetailLoading,
  isUsingPurchaseOrder,
}: Props) {
  const [errors, setErrors] = useState<PurchaseErrors>({});
  const [saving, setSaving] = useState(false);

  const [searchProduct, setSearchProduct] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const inputBase = "w-full rounded-lg border px-3 py-2 text-base shadow-sm";
  const inputBaseNoShadow = "w-full rounded-lg border px-3 py-2 text-base";
  const selectBase = "w-full rounded-lg border px-3 py-2 text-base";
  const labelBase = "block text-sm font-medium mb-1";
  const labelMuted = "block text-sm font-medium text-gray-600 mb-1";

  // ✅ Reglas:
  // - Con OC: ocultar panel de agregar producto (formulario manual)
  // - Con OC: permitir editar SOLO precio de venta en carrito
  const disableManualProducts = isUsingPurchaseOrder || poDetailLoading;

  const lockQty = isUsingPurchaseOrder || poDetailLoading;
  const lockUnitPrice = isUsingPurchaseOrder || poDetailLoading;
  const lockSalePrice = poDetailLoading; // ✅ con OC se puede editar saleprice (siempre que no esté cargando)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateField = (field: PurchaseFormField, value: unknown) => {
    const error = validatePurchaseField(field, value, purchases ?? []);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  };

  useEffect(() => {
    if (form.orderNumber !== undefined) {
      validateField("orderNumber", form.orderNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.orderNumber]);

  useEffect(() => {
    validateField("products", cart.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  const cartProductIds = useMemo(
    () => new Set(cart.map((c) => c.productid)),
    [cart]
  );

  const filteredProducts = useMemo(() => {
    const base = products.filter((p) => !cartProductIds.has(p.productid));
    if (!searchProduct.trim()) return base;

    return base.filter((p) =>
      String(p.productname ?? "")
        .toLowerCase()
        .includes(searchProduct.toLowerCase())
    );
  }, [searchProduct, products, cartProductIds]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validatePurchaseForm(
      {
        orderNumber: form.orderNumber,
        invoiceNumber: form.invoiceNumber,
        supplier: form.supplier,
        registerDate: form.registerDate,
        description: form.description,
        amount: total,
        productsCount: cart.length,
        purchaseOrderId: form.purchaseOrderId,
        purchaseOrderFinalStateId: form.purchaseOrderFinalStateId,
      },
      purchases ?? []
    );

    if (isUsingPurchaseOrder) {
      const fs = Number(form.purchaseOrderFinalStateId || 0);
      if (![OC_APROBADA_ID, OC_ANULADA_ID].includes(fs)) {
        validationErrors.purchaseOrderFinalStateId =
          "Selecciona el estado final de la OC (Aprobada o Anulada).";
      }
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showWarning("Por favor completa los campos requeridos", {
        autoClose: 5000,
      });
      return;
    }

    if (!isUsingPurchaseOrder) {
      for (const item of cart) {
        if (!item.productid) {
          showWarning("Hay un producto inválido en el carrito.", {
            autoClose: 5000,
          });
          return;
        }
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
          showWarning("Hay cantidades inválidas en el carrito.", {
            autoClose: 5000,
          });
          return;
        }
        if (!Number.isFinite(item.unitprice) || item.unitprice <= 0) {
          showWarning("Hay precios de compra inválidos en el carrito.", {
            autoClose: 5000,
          });
          return;
        }
        if (item.saleprice !== undefined && item.saleprice < item.unitprice) {
          showWarning(
            `El precio de venta no puede ser menor al de compra (ID ${item.productid}).`,
            { autoClose: 5000 }
          );
          return;
        }
      }
    } else {
      for (const item of cart) {
        if (item.saleprice !== undefined && item.saleprice < item.unitprice) {
          showWarning(
            `El precio de venta no puede ser menor al de compra (ID ${item.productid}).`,
            { autoClose: 5000 }
          );
          return;
        }
      }
    }

    try {
      setSaving(true);
      await onSave();
      await fetchPurchases();
      onClose(true);
    } catch (error) {
      console.error(error);
      showError("Error al registrar la compra.");
    } finally {
      setSaving(false);
    }
  };

  const selectedSupplier = suppliers.find(
    (s) => String(s.supplierid) === String(form.supplier)
  );

  return (
    <form
      noValidate
      onSubmit={handleFormSubmit}
      className="space-y-6 p-6 md:p-8 w-full max-w-screen-2xl mx-auto rounded-lg"
    >
      <div className="bg-white border rounded-lg px-5 py-4 md:px-6 md:py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold">Resumen</h2>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-lg md:text-l font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200 shadow-sm">
              {formatCOP(total)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className={labelBase}>
              Fecha de Registro <span className="text-red-500">*</span>
            </label>

            <input
              type="date"
              name="registerDate"
              value={form.registerDate}
              onChange={(e) => {
                handleChange(e);
                validateField("registerDate", e.target.value);
              }}
              onBlur={() => validateField("registerDate", form.registerDate)}
              className={`${inputBaseNoShadow} ${
                errors.registerDate ? "border-red-500" : "border-gray-300"
              }`}
            />

            {errors.registerDate && (
              <p className="text-xs text-red-500 mt-1">{errors.registerDate}</p>
            )}
          </div>

          <div className="md:col-span-1">
            <label className={labelBase}>
              N° de Orden <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="orderNumber"
              value={form.orderNumber}
              readOnly
              className={`${inputBaseNoShadow} bg-gray-100 ${
                errors.orderNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.orderNumber && (
              <p className="text-xs text-red-500">{errors.orderNumber}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className={labelBase}>
              Número de Factura <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="FAC-2025-1001"
              name="invoiceNumber"
              value={form.invoiceNumber}
              onChange={(e) => {
                handleChange(e);
                validateField("invoiceNumber", e.target.value);
              }}
              onBlur={() => validateField("invoiceNumber", form.invoiceNumber)}
              className={`${inputBaseNoShadow} ${
                errors.invoiceNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.invoiceNumber && (
              <p className="text-xs text-red-500">{errors.invoiceNumber}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg px-5 py-4 md:px-6 md:py-5">
        <h2 className="text-base md:text-lg font-semibold mb-3">Proveedor</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2">
            <label className={labelBase}>
              Proveedor <span className="text-red-500">*</span>
            </label>

            <select
              name="supplier"
              value={form.supplier}
              onChange={(e) => {
                handleChange(e);
                validateField("supplier", e.target.value);
              }}
              onBlur={() => validateField("supplier", form.supplier)}
              className={`${selectBase} ${
                errors.supplier ? "border-red-500" : "border-gray-300"
              }`}
              disabled={poLoading || poDetailLoading}
            >
              <option value="">Selecciona el proveedor</option>
              {suppliers.map((s) => (
                <option key={s.supplierid} value={s.supplierid}>
                  {s.name} - {s.nit}
                </option>
              ))}
            </select>

            {errors.supplier && (
              <p className="text-xs text-red-500 mt-1">{errors.supplier}</p>
            )}

            <div className="mt-4">
              <label className={labelBase}>Orden de compra (Pendiente)</label>

              <select
                name="purchaseOrderId"
                value={form.purchaseOrderId}
                onChange={handleChange}
                disabled={!form.supplier || poLoading || poDetailLoading}
                className={`${selectBase} ${
                  !form.supplier || poLoading || poDetailLoading
                    ? "bg-gray-100"
                    : "bg-white"
                }`}
              >
                <option value="">
                  {!form.supplier
                    ? "Selecciona primero un proveedor"
                    : poLoading
                    ? "Cargando órdenes..."
                    : purchaseOrders.length === 0
                    ? "No hay órdenes pendientes para este proveedor"
                    : "Selecciona la orden (opcional)"}
                </option>

                {purchaseOrders.map((po) => {
                  const dateLabel = formatDateOnly(po.fecha);
                  return (
                    <option key={po.id} value={po.id}>
                      {po.numeroOrden}
                      {dateLabel ? ` — ${dateLabel}` : ""}
                    </option>
                  );
                })}
              </select>

              {!form.purchaseOrderId && form.supplier && !poLoading && (
                <p className="text-xs text-gray-500 mt-1">
                  Solo aparecen OCs del proveedor en estado Pendiente.
                </p>
              )}

              {form.purchaseOrderId && (
                <p className="text-xs text-gray-500 mt-1">
                  Al seleccionar una OC, el carrito se llena automáticamente y
                  se bloquea la edición manual.
                </p>
              )}

              {poDetailLoading && (
                <p className="text-xs text-gray-500 mt-1">
                  Cargando detalle de la OC...
                </p>
              )}
            </div>

            {isUsingPurchaseOrder && (
              <div className="mt-4">
                <label className={labelBase}>
                  Estado final de la OC <span className="text-red-500">*</span>
                </label>

                <select
                  name="purchaseOrderFinalStateId"
                  value={form.purchaseOrderFinalStateId}
                  onChange={handleChange}
                  disabled={poDetailLoading}
                  className={`${selectBase} ${
                    errors.purchaseOrderFinalStateId
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Selecciona el estado final</option>
                  <option value={String(OC_APROBADA_ID)}>Aprobada</option>
                  <option value={String(OC_ANULADA_ID)}>Anulada</option>
                </select>

                {errors.purchaseOrderFinalStateId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.purchaseOrderFinalStateId}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="border rounded-lg bg-gray-50 p-3 h-full min-h-[108px] flex items-center">
              {form.supplier ? (
                <div className="flex items-center gap-3 w-full min-w-0">
                  <div className="w-14 h-14 rounded-md bg-white border overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={selectedSupplier?.image || DEFAULT_SUPPLIER_IMAGE}
                      alt="Proveedor"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          DEFAULT_SUPPLIER_IMAGE;
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-800 truncate">
                      {selectedSupplier?.name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {selectedSupplier?.nit}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-base text-gray-500">
                  Selecciona un proveedor para ver información rápida.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg px-5 py-4 md:px-6 md:py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold">
            Productos <span className="text-red-500">*</span>
          </h2>

          <div className="text-sm text-gray-600">
            {cart.length} item(s) en carrito
          </div>
        </div>

        {errors.products && (
          <p className="text-xs text-red-500 mt-1">{errors.products}</p>
        )}

        {isUsingPurchaseOrder && (
          <div className="mb-4 rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Esta compra está asociada a una Orden de Compra. Los productos se
            cargan desde la OC y no se pueden modificar manualmente aquí.
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 xl:min-h-[460px]">
          {!isUsingPurchaseOrder && (
            <div className="xl:col-span-2">
              <label className="block text-base font-medium mb-2">
                Producto
              </label>

              <label className={labelMuted}>
                Buscar o seleccionar <span className="text-red-500">*</span>
              </label>

              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Escribe el nombre del producto"
                  className={inputBase}
                  value={
                    selectedProduct
                      ? products.find(
                          (p) => p.productid === Number(selectedProduct)
                        )?.productname
                      : searchProduct
                  }
                  onChange={(e) => {
                    setSearchProduct(e.target.value);
                    setSelectedProduct("");
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                />

                {dropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {filteredProducts.length === 0 ? (
                      <p className="p-3 text-base text-gray-500">
                        No hay productos disponibles (o ya están agregados)
                      </p>
                    ) : (
                      filteredProducts.map((p) => (
                        <div
                          key={p.productid}
                          onClick={() => {
                            setSelectedProduct(String(p.productid));
                            setPurchasePrice(
                              p.productpriceofsupplier
                                ? String(p.productpriceofsupplier)
                                : ""
                            );
                            setSalePrice("");
                            setSearchProduct("");
                            setDropdownOpen(false);
                          }}
                          className="p-2 cursor-pointer hover:bg-gray-100 text-base flex justify-between"
                        >
                          <span className="truncate pr-2">{p.productname}</span>
                          <span className="text-gray-600 font-semibold">
                            {formatCOP(p.productpriceofsupplier || 0)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div>
                  <label className={labelMuted}>
                    Precio compra (unidad) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="$ 15.000"
                    value={
                      hasDigits(purchasePrice)
                        ? formatCOP(parseCOP(purchasePrice))
                        : ""
                    }
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className={labelMuted}>Precio venta (unidad)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="$ 25.000"
                    value={hasDigits(salePrice) ? formatCOP(parseCOP(salePrice)) : ""}
                    onChange={(e) => setSalePrice(e.target.value)}
                    onBlur={() => {
                      if (!hasDigits(salePrice) && hasDigits(purchasePrice)) {
                        const price = parseCOP(purchasePrice);
                        const auto = autoSalePrice(price);
                        if (auto > 0) setSalePrice(String(auto));
                      }
                    }}
                    className={inputBase}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelMuted}>
                    Cantidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    placeholder="0"
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className={inputBase}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!form.supplier) {
                    validateField("supplier", form.supplier);
                    showWarning("Selecciona primero un proveedor.", {
                      autoClose: 5000,
                    });
                    return;
                  }

                  if (!selectedProduct) {
                    setErrors((prev) => ({
                      ...prev,
                      products: "Selecciona un producto para agregar",
                    }));
                    showWarning("Selecciona un producto para agregar.", {
                      autoClose: 5000,
                    });
                    return;
                  }

                  const price = parseCOP(purchasePrice);
                  if (!price || price <= 0) {
                    showWarning("Ingresa un precio de compra válido.", {
                      autoClose: 5000,
                    });
                    return;
                  }

                  if (!Number.isFinite(quantity) || quantity <= 0) {
                    showWarning("La cantidad debe ser mayor que 0.", {
                      autoClose: 5000,
                    });
                    return;
                  }

                  addToCart();
                }}
                style={{ backgroundColor: Colors.buttons.primary }}
                className="cursor-pointer mt-4 w-full px-4 py-2.5 rounded-lg text-white text-base font-medium shadow hover:scale-[1.02] transition"
              >
                Añadir producto +
              </button>
            </div>
          )}

          <div className={isUsingPurchaseOrder ? "xl:col-span-5" : "xl:col-span-3"}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-semibold text-gray-800">Carrito</p>

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-green-700 bg-green-50 border border-green-200">
                Subt. {formatCOP(total)}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="border rounded-lg bg-gray-50 p-4 text-base text-gray-600">
                {isUsingPurchaseOrder
                  ? "Esta Orden de Compra no tiene productos para cargar."
                  : "Agrega productos desde el panel izquierdo."}
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {cart.map((item, index) => (
                  <div
                    key={`${item.productid}-${index}`}
                    className="bg-white p-3 rounded-lg shadow border hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-base text-gray-800 truncate">
                            {item.productname}
                          </span>

                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 shrink-0">
                            ID {item.productid}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          Subtotal: {formatCOP(item.unitprice * item.quantity)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className={`p-2 rounded transition shrink-0 ${
                          disableManualProducts
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-red-100"
                        }`}
                        title={
                          disableManualProducts
                            ? "Bloqueado por Orden de Compra"
                            : "Eliminar"
                        }
                        disabled={disableManualProducts}
                      >
                        <img
                          src="/icons/delete.svg"
                          alt="Eliminar"
                          className="w-5 h-5 opacity-80 hover:opacity-100"
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className={labelMuted}>Cantidad</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItem(index, {
                              quantity: Number(e.target.value),
                            })
                          }
                          className={`${inputBaseNoShadow} ${
                            lockQty ? "bg-gray-100" : ""
                          }`}
                          disabled={lockQty}
                        />
                      </div>

                      <div>
                        <label className={labelMuted}>Precio compra (unidad)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatCOP(item.unitprice)}
                          onChange={(e) => {
                            const v = parseCOP(e.target.value);
                            updateCartItem(index, { unitprice: v });
                          }}
                          className={`${inputBaseNoShadow} ${
                            lockUnitPrice ? "bg-gray-100" : ""
                          }`}
                          disabled={lockUnitPrice}
                        />
                      </div>

                      <div>
                        <label className={labelMuted}>Precio venta (unidad)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            item.saleprice === undefined
                              ? ""
                              : formatCOP(item.saleprice)
                          }
                          onChange={(e) =>
                            updateCartItem(index, {
                              saleprice: hasDigits(e.target.value)
                                ? parseCOP(e.target.value)
                                : undefined,
                            })
                          }
                          className={`${inputBaseNoShadow} ${
                            lockSalePrice ? "bg-gray-100" : ""
                          }`}
                          disabled={lockSalePrice}
                          placeholder={isUsingPurchaseOrder ? "$ 0" : ""}
                        />

                        {item.saleprice !== undefined &&
                          item.saleprice < item.unitprice && (
                            <p className="text-xs text-red-500 mt-1">
                              El precio de venta no puede ser menor que el de compra.
                            </p>
                          )}
                      </div>
                    </div>

                    {isUsingPurchaseOrder && (
                      <p className="text-xs text-gray-500 mt-2">
                        Este ítem proviene de la OC: solo puedes editar el precio de venta.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg px-5 py-4 md:px-6 md:py-5">
        <label className={labelBase}>Observaciones</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2 text-base resize-none"
          rows={3}
          placeholder="Notas adicionales de la compra"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button
          type="button"
          onClick={() => onClose(false)}
          className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2.5 rounded-lg bg-gray-300 text-black text-base w-full sm:w-auto"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={saving || poDetailLoading}
          className="cursor-pointer transition duration-300 hover:bg-black hover:text-white hover:scale-105 px-4 py-2.5 rounded-lg bg-black text-white text-base w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
          title={poDetailLoading ? "Cargando detalle de OC..." : "Guardar"}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
