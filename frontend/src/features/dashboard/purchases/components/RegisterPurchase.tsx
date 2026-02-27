"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Colors from "@/shared/theme/colors";
import { IPurchase } from "../Types/Purchase.type";
import { showSuccess, showWarning, showError } from "@/shared/utils/notifications";
import {
  validatePurchaseForm,
  validatePurchaseField,
  PurchaseErrors,
} from "../validations/purchasesValidations";
import { useLoader } from "@/shared/components/loader";
import { PurchaseFormState } from "../hooks/usePurchases";

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

// ✅ NUEVO (único cambio adicional para permitir opcional real)
const onlyDigits = (s: string) => (s ?? "").replace(/[^\d]/g, "");
const hasDigits = (s: string) => onlyDigits(s).length > 0;

type CartItem = {
  productid: number;
  productname: string;
  quantity: number;
  unitprice: number;
  saleprice?: number;
};

interface Props {
  onSave: () => Promise<any>;
  onClose: () => void;
  purchases: IPurchase[];
  fetchPurchases: () => Promise<void>;
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;

  addToCart: () => void;

  products: any[];
  suppliers: any[];

  purchaseOrders: any[];
  poLoading: boolean;
}

export default function RegisterPurchaseForm({
  onSave,
  onClose,
  purchases,
  form,
  selectedProduct,
  fetchPurchases,
  setSelectedProduct,
  quantity,
  setQuantity,
  purchasePrice,
  setPurchasePrice,
  salePrice,
  setSalePrice,
  cart,
  total,
  handleChange,
  addToCart,
  removeFromCart,
  updateCartItem,
  products,
  suppliers,
  purchaseOrders,
  poLoading,
}: Props) {
  const [errors, setErrors] = useState<PurchaseErrors>({});
  const [saving, setSaving] = useState(false);

  const [searchProduct, setSearchProduct] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { showLoader, hideLoader } = useLoader();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFieldValidation = (
    field: keyof Omit<IPurchase, "id">,
    value: any
  ) => {
    const error = validatePurchaseField(field, value, purchases);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

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

    if (cart.length === 0) {
      showWarning("Agrega al menos un producto al carrito.");
      return;
    }

    const validationErrors = validatePurchaseForm(
      {
        orderNumber: form.orderNumber,
        invoiceNumber: form.invoiceNumber,
        supplier: form.supplier,
        registerDate: form.registerDate,
        amount: total,
        status: "Aprobado",
        description: form.description,
      } as any,
      purchases ?? []
    );

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showError("Corrige los errores antes de guardar.");
      return;
    }

    try {
      showLoader();
      setSaving(true);

      await onSave();
      await fetchPurchases();

      showSuccess("Compra registrada con éxito.");
      onClose();
    } catch (error) {
      console.error(error);
      showError("Error al registrar la compra.");
    } finally {
      hideLoader();
      setSaving(false);
    }
  };

  const selectedSupplier = suppliers.find(
    (s) => String(s.supplierid) === String(form.supplier)
  );

  return (
    <form
      onSubmit={handleFormSubmit}
      className="space-y-6 p-6 md:p-8 w-full mx-auto rounded-lg"
    >
      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Fecha de Registro <span className="text-red-500">*</span>
        </label>

        <input
          type="date"
          name="registerDate"
          value={form.registerDate}
          onChange={(e) => {
            handleChange(e);
            handleFieldValidation("registerDate", e.target.value);
          }}
          required
          className={`w-full rounded-md border px-2 py-2 text-sm ${
            errors.createdAt ? "border-red-500" : "border-gray-300"
          }`}
        />

        {errors.registerDate && (
          <p className="text-xs text-red-500 mt-1">{errors.registerDate}</p>
        )}
      </div>

      {/* N° Orden y Proveedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm mb-1 font-medium">
            N° de Orden <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="orderNumber"
            value={form.orderNumber}
            readOnly
            className={`w-full rounded-md border px-2 py-2 text-sm bg-gray-100 ${
              errors.orderNumber ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.orderNumber && (
            <p className="text-xs text-red-500">{errors.orderNumber}</p>
          )}
        </div>

        <div>
          {form.supplier && (
            <div className="flex items-center gap-2 mt-2 p-2 border rounded-md bg-gray-50">
              <img
                src={selectedSupplier?.image || DEFAULT_SUPPLIER_IMAGE}
                alt="Proveedor"
                className="w-10 h-10 rounded object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_SUPPLIER_IMAGE;
                }}
              />

              <span className="text-sm font-medium text-gray-700">
                {selectedSupplier?.name}
              </span>
            </div>
          )}

          <label className="block text-sm mb-1 font-medium">
            Proveedor <span className="text-red-500">*</span>
          </label>
          <select
            name="supplier"
            value={form.supplier}
            onChange={(e) => {
              handleChange(e);
              handleFieldValidation("supplier", e.target.value);
            }}
            className={`w-full rounded-md border px-2 py-2 text-sm ${
              errors.supplier ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Selecciona el proveedor</option>
            {suppliers.map((s) => (
              <option key={s.supplierid} value={s.supplierid}>
                {s.name} - {s.nit}
              </option>
            ))}
          </select>

          {errors.supplier && (
            <p className="text-xs text-red-500">{errors.supplier}</p>
          )}
        </div>
      </div>

      {/* NUEVO: Orden de compra (habilitado solo si hay proveedor) */}
      <div>
        <label className="block text-sm mb-1 font-medium">
          Orden de compra (Pendiente) <span className="text-red-500">*</span>
        </label>

        <select
          name="purchaseOrderId"
          value={form.purchaseOrderId}
          onChange={handleChange}
          disabled={!form.supplier || poLoading}
          className={`w-full rounded-md border px-2 py-2 text-sm ${
            !form.supplier || poLoading ? "bg-gray-100" : "bg-white"
          }`}
        >
          <option value="">
            {!form.supplier
              ? "Selecciona primero un proveedor"
              : poLoading
              ? "Cargando órdenes..."
              : purchaseOrders.length === 0
              ? "No hay órdenes pendientes para este proveedor"
              : "Selecciona la orden"}
          </option>

          {purchaseOrders.map((po: any) => (
            <option key={po.id} value={po.id}>
              {po.numeroOrden} — {new Date(po.fecha).toLocaleDateString()}
            </option>
          ))}
        </select>

        {!form.purchaseOrderId && form.supplier && !poLoading && (
          <p className="text-xs text-gray-500 mt-1">
            Solo aparecen OCs del proveedor en estado Pendiente.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1 font-medium">
          Número de Factura <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="FAC-2025-1001"
          name="invoiceNumber"
          value={form.invoiceNumber}
          onChange={(e) => {
            handleChange(e);
            handleFieldValidation("invoiceNumber", e.target.value);
          }}
          className={`w-full rounded-md border px-2 py-2 text-sm ${
            errors.invoiceNumber ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.invoiceNumber && (
          <p className="text-xs text-red-500">{errors.invoiceNumber}</p>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1 font-medium">
          Total <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formatCOP(total)}
          readOnly
          className={`w-full rounded-md border px-2 py-2 text-sm bg-gray-100 ${
            errors.amount ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
      </div>

      {/* Productos */}
      <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
        <label className="block text-center text-xl font-semibold mb-3">
          Productos <span className="text-red-500">*</span>
        </label>

        <label className="block text-sm font-medium mb-2">Producto</label>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Buscar o seleccionar
            </label>

            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                placeholder="Escribe el nombre del producto"
                className="w-100 border rounded-md px-3 py-2 text-sm shadow-sm"
                value={
                  selectedProduct
                    ? products.find((p) => p.productid === Number(selectedProduct))
                        ?.productname
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
                <div className="absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                  {filteredProducts.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">
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
                        className="p-2 cursor-pointer hover:bg-gray-100 text-sm flex justify-between"
                      >
                        <span>{p.productname}</span>
                        <span className="text-gray-600 font-semibold">
                          {formatCOP(p.productpriceofsupplier || 0)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 sm:w-32">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Precio compra (unidad)
            </label>

            <input
              type="text"
              inputMode="numeric"
              placeholder="$ 15.000"
              // ✅ CAMBIO: solo formatea si hay dígitos
              value={hasDigits(purchasePrice) ? formatCOP(parseCOP(purchasePrice)) : ""}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full rounded-md border px-2 py-2 text-sm shadow-sm"
            />
          </div>

          <div className="flex-1 sm:w-32">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Precio venta (unidad) — opcional
            </label>

            <input
              type="text"
              inputMode="numeric"
              placeholder="$ 25.000"
              // ✅ CAMBIO: solo formatea si hay dígitos (así queda realmente vacío si borran)
              value={hasDigits(salePrice) ? formatCOP(parseCOP(salePrice)) : ""}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full rounded-md border px-2 py-2 text-sm shadow-sm"
            />
          </div>

          <div className="flex-1 sm:w-20">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Cantidad
            </label>

            <input
              type="number"
              value={quantity}
              min={1}
              placeholder="0"
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-12 rounded-md border px-2 py-2 text-center text-sm shadow-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!form.supplier) {
              showWarning("Selecciona primero un proveedor.");
              return;
            }
            addToCart();
          }}
          style={{ backgroundColor: Colors.buttons.primary }}
          className="cursor-pointer mt-4 w-full px-4 py-2 rounded-md text-white text-sm font-medium shadow hover:scale-[1.02] transition"
        >
          Añadir producto +
        </button>

        {cart.length > 0 && (
          <div className="mt-5 space-y-3">
            {cart.map((item, index) => (
              <div
                key={`${item.productid}-${index}`}
                className="bg-white p-3 rounded-md shadow border hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-800">
                        {item.productname}
                      </span>

                      <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                        ID {item.productid}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1">
                      Subtotal: {formatCOP(item.unitprice * item.quantity)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(index)}
                    className="p-2 rounded hover:bg-red-100 transition shrink-0"
                    title="Eliminar"
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateCartItem(index, { quantity: Number(e.target.value) })
                      }
                      className="w-full rounded-md border px-2 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Precio compra (unidad)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCOP(item.unitprice)}
                      onChange={(e) => {
                        const v = parseCOP(e.target.value);
                        updateCartItem(index, { unitprice: v });
                      }}
                      className="w-full rounded-md border px-2 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Precio venta (unidad) — opcional
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        item.saleprice === undefined ? "" : formatCOP(item.saleprice)
                      }
                      onChange={(e) =>
                        updateCartItem(index, {
                          saleprice:
                            e.target.value.trim() === ""
                              ? undefined
                              : parseCOP(e.target.value),
                        })
                      }
                      className="w-full rounded-md border px-2 py-2 text-sm"
                    />
                    {item.saleprice !== undefined && item.saleprice < item.unitprice && (
                      <p className="text-xs text-red-500 mt-1">
                        El precio de venta no puede ser menor que el de compra.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1 font-medium">Observaciones</label>
        <textarea
          name="description"
          value={form.description}
          onChange={(e) => {
            handleChange(e);
            handleFieldValidation("description" as any, e.target.value);
          }}
          className="w-full rounded-md border px-2 py-2 text-sm resize-none"
          rows={3}
          placeholder="Notas adicionales de la compra"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer transition duration-300 hover:bg-black hover:text-white hover:scale-105 px-4 py-2 rounded-lg bg-black text-white w-full sm:w-auto"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}