"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Colors from "@/shared/theme/colors";
import { IPurchase } from "../Types/Purchase.type";
import {
  showSuccess,
  showWarning,
  showError,
} from "@/shared/utils/notifications";
import {
  validatePurchaseForm,
  validatePurchaseField,
  PurchaseErrors,
} from "../validations/purchasesValidations";
import { useLoader } from "@/shared/components/loader";
import { months, PurchaseFormState } from "../hooks/usePurchases";

const DEFAULT_SUPPLIER_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/1698/1698535.png";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

type CartItem = {
  isNew: boolean;
  productid?: number;
  productname?: string;
  description?: string;
  productpriceofsupplier?: number;
  saleprice?: number;
  quantity: number;
  unitprice: number;
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
  cart: CartItem[];
  years: number;
  daysInMonth: number;
  total: number;
  removeFromCart: (index: number) => void;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  handleAddProduct: (args: {
    isNew: boolean;
    productName: string;
    supplierPrice: number;
    selectedProduct: string;
    quantity: number;
    description: string;
    salePrice?: number;
  }) => void;
  products: any[];
  suppliers: any[];
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
  cart,
  total,
  handleChange,
  handleAddProduct,
  removeFromCart,
  products,
  suppliers,
}: Props) {
  const [errors, setErrors] = useState<PurchaseErrors>({});
  const [isNewProduct, setIsNewProduct] = useState(false);

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState<number | "">("");
  const [newProductSalePrice, setNewProductSalePrice] = useState<number | "">(
    ""
  );

  const [existingSalePrice, setExistingSalePrice] = useState<number | "">("");
  const [productDescription, setProductDescription] = useState("");
  const [duplicateProductError, setDuplicateProductError] = useState("");
  const [saving, setSaving] = useState(false);

  const [searchProduct, setSearchProduct] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [selectedSupplierPrice, setSelectedSupplierPrice] = useState<
    number | ""
  >(""); // ya lo tenías

  const filteredProducts = useMemo(() => {
    if (!searchProduct.trim()) return products;
    return products.filter((p) =>
      p.productname.toLowerCase().includes(searchProduct.toLowerCase())
    );
  }, [searchProduct, products]);

  const { showLoader, hideLoader } = useLoader();

  const handleFieldValidation = (
    field: keyof Omit<IPurchase, "id">,
    value: any
  ) => {
    const error = validatePurchaseField(field, value, purchases);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

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

  const getSelectedProduct = () =>
    products.find((p) => p.productid === Number(selectedProduct));

  const handleAddProductClick = () => {
    if (!isNewProduct && !selectedProduct) {
      showWarning("Selecciona un producto.");
      return;
    }

    if (
      isNewProduct &&
      (!newProductName || !newProductPrice || newProductPrice <= 0)
    ) {
      showWarning(
        "Completa los datos del nuevo producto (nombre y precio proveedor)."
      );
      return;
    }

    if (!isNewProduct) {
      // *** Validar que haya cantidad y precio en el input
      if (!selectedSupplierPrice || Number(selectedSupplierPrice) <= 0) {
        showWarning(
          "Ingresa un precio de compra válido para el producto seleccionado."
        );
        return;
      }
      if (!quantity || quantity <= 0) {
        showWarning("La cantidad debe ser mayor que 0.");
        return;
      }
    }

    let supplierPrice = 0;
    let salePrice: number | undefined;

    if (isNewProduct) {
      supplierPrice = Number(newProductPrice);
      salePrice =
        newProductSalePrice === "" ? undefined : Number(newProductSalePrice);
    } else {
      const product = getSelectedProduct();
      if (!product) {
        showWarning("Selecciona un producto válido.");
        return;
      }

      // *** AQUÍ USAMOS EL VALOR DEL INPUT, NO EL DE BD
      supplierPrice =
        selectedSupplierPrice === "" ? 0 : Number(selectedSupplierPrice);

      salePrice =
        existingSalePrice === "" ? undefined : Number(existingSalePrice);
    }

    // Validación rápida coherente con backend
    if (salePrice !== undefined && salePrice < supplierPrice) {
      showError(
        "El precio de venta no puede ser menor que el precio proveedor."
      );
      return;
    }

    // Validar duplicado cuando no es producto nuevo
    if (!isNewProduct) {
      const exists = cart.some(
        (item) => item.productid === Number(selectedProduct)
      );

      if (exists) {
        setDuplicateProductError("Este producto ya fue agregado.");
        return;
      }
    }

    setDuplicateProductError("");

    handleAddProduct({
      isNew: isNewProduct,
      productName: newProductName,
      supplierPrice,
      selectedProduct,
      quantity,
      description: productDescription,
      salePrice,
    });

    // Reset campos de producto
    setProductDescription("");
    if (isNewProduct) {
      setNewProductName("");
      setNewProductPrice("");
      setNewProductSalePrice("");
      setQuantity(1);
    } else {
      setExistingSalePrice("");
      setSelectedProduct("");
      setSelectedSupplierPrice(""); // *** limpiar input de precio compra
      setQuantity(1);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

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
                src={
                  suppliers.find((s) => s.supplierid == form.supplier)?.image ||
                  DEFAULT_SUPPLIER_IMAGE
                }
                alt="Proveedor"
                className="w-10 h-10 rounded object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    DEFAULT_SUPPLIER_IMAGE;
                }}
              />

              <span className="text-sm font-medium text-gray-700">
                {suppliers.find((s) => s.supplierid == form.supplier)?.name}
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

      {/* Número de Factura */}
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

      {/* Total */}
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
        {errors.amount && (
          <p className="text-xs text-red-500">{errors.amount}</p>
        )}
      </div>

      {/* Productos */}
      <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
        <label className="block text-center text-xl font-semibold mb-3">
          Productos <span className="text-red-500">*</span>
        </label>

        {/* Toggle Seleccionar / Crear */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setIsNewProduct(false);
              setNewProductName("");
              setNewProductPrice("");
              setNewProductSalePrice("");
              setSelectedSupplierPrice(""); // ***
            }}
            className={`text-xs px-3 py-2 rounded-md transition ${
              !isNewProduct
                ? "bg-black text-white shadow"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Seleccionar
          </button>

          <button
            type="button"
            onClick={() => {
              setIsNewProduct(true);
              setSelectedProduct("");
              setSearchProduct("");
              setExistingSalePrice("");
              setSelectedSupplierPrice(""); // ***
            }}
            className={`text-xs px-3 py-2 rounded-md transition ${
              isNewProduct
                ? "bg-black text-white shadow"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Crear producto
          </button>
        </div>

        {/* MODO SELECCIONAR PRODUCTO */}
        {!isNewProduct && (
          <>
            <label className="block text-sm font-medium mb-2">Producto</label>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              {/* BUSCADOR */}
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
                    <div className="absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                      {filteredProducts.length === 0 ? (
                        <p className="p-3 text-sm text-gray-500">
                          No hay productos que coincidan
                        </p>
                      ) : (
                        filteredProducts.map((p) => (
                          <div
                            key={p.productid}
                            onClick={() => {
                              setSelectedProduct(String(p.productid));
                              setSelectedSupplierPrice(
                                p.productpriceofsupplier || "" // ***
                              );
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

              {/* PRECIO COMPRA */}
              <div className="flex-1 sm:w-32">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Precio compra (unidad)
                </label>

                <input
                  type="number"
                  placeholder="Ej. 15000"
                  value={selectedSupplierPrice}
                  onChange={(e) =>
                    setSelectedSupplierPrice(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-md border px-2 py-2 text-sm shadow-sm"
                />
              </div>

              {/* PRECIO VENTA */}
              <div className="flex-1 sm:w-32">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Precio venta (unidad) — opcional
                </label>

                <input
                  type="number"
                  placeholder="Ej. 25000"
                  value={existingSalePrice}
                  onChange={(e) =>
                    setExistingSalePrice(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-md border px-2 py-2 text-sm shadow-sm"
                />
              </div>

              {/* CANTIDAD */}
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

            {duplicateProductError && (
              <p className="text-xs text-red-500 mt-1">
                {duplicateProductError}
              </p>
            )}
          </>
        )}

        {/* MODO CREAR PRODUCTO */}
        {isNewProduct && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nombre del producto
              </label>
              <input
                type="text"
                placeholder="Ej. Taladro industrial"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-100 rounded-md border px-3 py-2 text-sm shadow-sm"
              />
            </div>

            <div className="flex-1 sm:w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Precio compra (unidad)
              </label>
              <input
                type="number"
                placeholder="Ej. 15000"
                value={newProductPrice}
                onChange={(e) =>
                  setNewProductPrice(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full rounded-md border px-3 py-2 text-sm shadow-sm"
              />
            </div>

            <div className="flex-1 sm:w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Precio venta (unidad) — opcional
              </label>
              <input
                type="number"
                placeholder="Ej. 35000"
                value={newProductSalePrice}
                onChange={(e) =>
                  setNewProductSalePrice(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full rounded-md border px-3 py-2 text-sm shadow-sm"
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
                className="w-12 rounded-md border px-3 py-2 text-center text-sm shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Descripción */}
        <textarea
          placeholder="Descripción del producto"
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm resize-none mt-3 shadow-sm"
          rows={2}
        />

        {/* Botón agregar */}
        <button
          type="button"
          onClick={handleAddProductClick}
          style={{ backgroundColor: Colors.buttons.primary }}
          className="cursor-pointer mt-4 w-full px-4 py-2 rounded-md text-white text-sm font-medium shadow hover:scale-[1.02] transition"
        >
          Añadir producto +
        </button>

        {/* Carrito */}
        {cart.length > 0 && (
          <div className="mt-5 space-y-3">
            {cart.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between bg-white p-3 rounded-md shadow border hover:shadow-md transition gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">
                      {item.productname ||
                        products.find((p) => p.productid === item.productid)
                          ?.productname}
                    </span>

                    <span className="bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-1">
                    Compra: {formatCOP(item.unitprice)} • Total:{" "}
                    {formatCOP(item.unitprice * item.quantity)}
                  </p>

                  {item.saleprice !== undefined && (
                    <p className="text-xs text-gray-700">
                      Venta: {formatCOP(item.saleprice)}
                    </p>
                  )}

                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {item.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(index)}
                  className="p-2 rounded hover:bg-red-100 transition shrink-0"
                >
                  <img
                    src="/icons/delete.svg"
                    alt="Eliminar"
                    className="w-5 h-5 opacity-80 hover:opacity-100"
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observaciones */}
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

      {/* Botones */}
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className=" cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
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
