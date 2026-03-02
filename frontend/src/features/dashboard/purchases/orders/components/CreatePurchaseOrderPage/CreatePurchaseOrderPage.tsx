"use client";

import React, { useState, useEffect, useCallback } from "react";
import Colors from "@/shared/theme/colors";
import { createPurchaseOrderModalProps, createPurchaseOrderData } from "../../types/typesPurchaseOrder";
import { useCreatePurchaseOrderForm } from "../../hooks/usePurchaseOrders";
import {
  getSuppliers,
  ISupplier,
} from "@/features/dashboard/suppliers/services/suppliers.service";
import {
  getProductsBySupplier,
  generateOrderNumber,
  sendPurchaseOrderNotification,
  ProductoAPI,
  PurchaseOrderAPIResponse,
} from "../../services/suppliersOrderService";
import { getProducts } from "@/features/dashboard/products/api/products.api";
import { Product } from "@/features/dashboard/products/types/typesProducts";
import { showSuccess, showError, showWarning } from "@/shared/utils/notifications";
import { Loader } from "@/shared/components/loader";

interface ItemRow {
  productoNombre: string;
  productId?: number;
  cantidad: number;
  precioUnitario: number;
  imagen?: string;
}

interface CreatePurchaseOrderPageProps {
  onClose: () => void;
  onSaved: () => void;
  onSave: (purchaseOrderData: createPurchaseOrderData & { proveedorId?: number }) => Promise<PurchaseOrderAPIResponse | null>;
}

export const CreatePurchaseOrderPage: React.FC<CreatePurchaseOrderPageProps> = ({
  onClose,
  onSaved,
  onSave,
}) => {
  const {
    formData,
    errors,
    touched,
    handleInputChange,
    handleSupplierChange: handleSupplierChangeHook,
    handleBlur,
    isSubmitting,
    setItems,
    handleSubmit,
  } = useCreatePurchaseOrderForm({ 
    isOpen: true, 
    onClose, 
    onSave: async () => {} 
  });

  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<ProductoAPI[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  
  const [productSearch, setProductSearch] = useState<{[key: number]: string}>({});
  const [dropdownOpen, setDropdownOpen] = useState<{[key: number]: boolean}>({});
  const [rows, setRows] = useState<ItemRow[]>([
    { productoNombre: "", productId: undefined, cantidad: 1, precioUnitario: 0 },
  ]);
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);

  useEffect(() => {
    setOrderNumber(generateOrderNumber());
    setSelectedSupplier(null);
    setSupplierProducts([]);
    setRows([{ productoNombre: "", productId: undefined, cantidad: 1, precioUnitario: 0 }]);
    setProductSearch({});
    setDropdownOpen({});
    
    setLoadingSuppliers(true);
    getSuppliers()
      .then((data) => setSuppliers(data))
      .catch(() => showError("Error al cargar proveedores."))
      .finally(() => setLoadingSuppliers(false));
    
    setLoadingAllProducts(true);
    getProducts("active")
      .then((data) => setAllProducts(data))
      .catch(() => showError("Error al cargar productos."))
      .finally(() => setLoadingAllProducts(false));
  }, []);

  useEffect(() => {
    setItems(
      rows.map((r) => ({
        producto: r.productoNombre,
        productoId: r.productId,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        imagen: r.imagen,
      }))
    );
  }, [rows, setItems]);

  const handleSupplierChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const supplierId = Number(e.target.value);

      if (!supplierId) {
        setSelectedSupplier(null);
        setSupplierProducts([]);
        handleInputChange("proveedor", "");
        return;
      }

      const found = suppliers.find((s) => s.supplierid === supplierId);
      setSelectedSupplier(found || null);

      if (found) {
        handleSupplierChangeHook(found.name, found.supplierid);

        setLoadingProducts(true);
        try {
          const productos = await getProductsBySupplier(supplierId);
          setSupplierProducts(productos);
        } catch {
          setSupplierProducts([]);
        } finally {
          setLoadingProducts(false);
        }
      }
    },
    [suppliers, handleInputChange, handleSupplierChangeHook]
  );

  const handleProductSelect = (index: number, productName: string) => {
    const prod = supplierProducts.find((p) => p.productname === productName);
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              productoNombre: productName,
              productId: prod?.productid,
              cantidad: row.cantidad,
              precioUnitario: prod?.productpriceofsupplier ?? row.precioUnitario,
              imagen: prod?.image ?? undefined,
            }
          : row
      )
    );
    setProductSearch((prev) => ({ ...prev, [index]: "" }));
    setDropdownOpen((prev) => ({ ...prev, [index]: false }));
  };

  const handleAllProductSelect = (index: number, product: Product) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              productoNombre: product.name,
              productId: product.id,
              cantidad: row.cantidad,
              precioUnitario: product.supplierPrice ?? row.precioUnitario,
              imagen: product.image ?? undefined,
            }
          : row
      )
    );
    setProductSearch((prev) => ({ ...prev, [index]: "" }));
    setDropdownOpen((prev) => ({ ...prev, [index]: false }));
  };

  const handleManualProductChange = (index: number, value: string) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              productoNombre: value,
              productId: undefined,
            }
          : row
      )
    );
    setProductSearch((prev) => ({ ...prev, [index]: value }));
  };

  const handleProductSearchChange = (index: number, value: string) => {
    setProductSearch((prev) => ({ ...prev, [index]: value }));
    setDropdownOpen((prev) => ({ ...prev, [index]: true }));
  };

  const getFilteredProducts = (search: string) => {
    if (!search.trim()) return supplierProducts;
    return supplierProducts.filter((p) =>
      p.productname.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleRowChange = <K extends keyof ItemRow>(
    index: number,
    field: K,
    value: ItemRow[K]
  ) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, { productoNombre: "", productId: undefined, cantidad: 1, precioUnitario: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendAndSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      showError("Seleccione un proveedor antes de guardar.");
      return;
    }

    const rowsWithoutProduct = rows.filter((r) => !r.productoNombre.trim());
    if (rowsWithoutProduct.length > 0) {
      showError("Todos los productos deben tener nombre.");
      return;
    }

    const validRows = rows.filter((r) => r.productoNombre.trim() && r.cantidad > 0);
    if (validRows.length === 0) {
      showError("Debe agregar al menos un producto con cantidad mayor a 0.");
      return;
    }

    const itemsWithoutId = validRows.filter((r) => !r.productId);
    if (itemsWithoutId.length > 0) {
      showWarning(`${itemsWithoutId.length} producto(s) se guardarán como entrada manual sin vinculación a la base de datos.`);
    }

    // ============================================================
    // FLUJO CORREGIDO: 
    // 1. Primero: Guardar la orden en la base de datos
    // 2. Segundo: Intentar enviar la notificación al proveedor
    //    (si falla, la orden ya está guardada)
    // ============================================================

    const subtotal = rows.reduce((acc, r) => acc + r.cantidad * r.precioUnitario, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    // Preparar datos para guardar la orden
    const purchaseOrderData = {
      proveedor: selectedSupplier.name,
      proveedorId: selectedSupplier.supplierid,
      fecha: formData.fecha,
      descripcion: formData.descripcion,
      items: rows.map((r) => ({
        producto: r.productoNombre,
        productoId: r.productId,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        imagen: r.imagen,
      })),
    };

    // ============================================================
    // PRIMER PASO: Guardar la orden en la base de datos
    // ============================================================
    setIsSending(true);
    
    let savedOrder: PurchaseOrderAPIResponse | null = null;
    try {
      savedOrder = await onSave(purchaseOrderData);
    } catch (error: any) {
      console.error("Error al guardar orden:", error);
      showError(error?.message || "Error al guardar la orden de compra.");
      setIsSending(false);
      return;
    }

    const realOrderNumber = savedOrder?.numeroOrden;
    if (!realOrderNumber) {
      showError("No se pudo obtener el número de orden guardada.");
      setIsSending(false);
      return;
    }

    // ============================================================
    // SEGUNDO paso: Intentar enviar la notificación al proveedor
    // (la orden ya está guardada, la notificación es secundario)
    // ============================================================
    
    // Preparar datos para la notificación
    const notificationPayload = {
      numeroOrden: realOrderNumber,
      proveedorId: selectedSupplier.supplierid,
      supplierName: selectedSupplier.name,
      supplierEmail: selectedSupplier.email || undefined,
      supplierPhone: selectedSupplier.phone || undefined,
      productos: rows.map((r) => ({
        producto: r.productoNombre,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
      })),
      total,
      fecha: formData.fecha,
      descripcion: formData.descripcion,
    };

    // Intentar enviar notificación solo si el proveedor tiene contacto
    if (selectedSupplier.email || selectedSupplier.phone) {
      try {
        const notificationResult = await sendPurchaseOrderNotification(notificationPayload);
        
        if (notificationResult.success) {
          showSuccess(
            `Orden guardada. Notificación enviada por ${notificationResult.channel === "both" 
              ? "WhatsApp y correo" 
              : notificationResult.channel === "email" 
                ? "correo" 
                : "WhatsApp"
            }.`
          );
        }
      } catch (error: any) {
        console.error("Error al enviar notificación:", error);
        showWarning("Orden guardada. No se pudo enviar la notificación al proveedor.");
      }
    } else {
      showWarning("Orden guardada. El proveedor no tiene contacto registrado.");
    }

    setIsSending(false);
    
    // Notificar éxito del guardado
    showSuccess("Orden de compra guardada exitosamente.");
    
    onSaved();
    onClose();
  };

  const subtotal = rows.reduce((acc, r) => acc + r.cantidad * r.precioUnitario, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return (
    <div className="flex flex-col gap-6 md:flex-row h-full max-h-[calc(100vh-160px)] overflow-y-auto p-2">
      {(isSubmitting || isSending) && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <Loader size="md" />
            <span className="text-gray-700 font-medium">
              {isSending ? "Enviando notificación y guardando orden..." : "Guardando orden de compra..."}
            </span>
          </div>
        </div>
      )}

      {/* Left Column: Form */}
      <div className="md:w-[65%] flex flex-col gap-6">
        {/* Header Card */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="mb-4 text-lg font-bold" style={{ color: Colors.texts.primary }}>
            Datos de la Orden de Compra
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* N° Orden */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                N° Orden (Auto)
              </label>
              <input
                type="text"
                value={orderNumber}
                readOnly
                tabIndex={-1}
                className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed select-none"
              />
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSupplier?.supplierid?.toString() ?? ""}
                onChange={handleSupplierChange}
                onBlur={() => handleBlur("proveedor")}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                style={{
                  borderColor: errors.proveedor && touched.proveedor ? "red" : Colors.table.lines,
                }}
                disabled={loadingSuppliers}
              >
                <option value="">
                  {loadingSuppliers ? "Cargando proveedores..." : "Seleccione un proveedor"}
                </option>
                {suppliers.map((s) => (
                  <option key={s.supplierid} value={s.supplierid}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.proveedor && touched.proveedor && (
                <span className="text-red-500 text-xs mt-1">{errors.proveedor}</span>
              )}
            </div>

            {/* Fecha estimada de entrega */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Fecha estimada de entrega <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange("fecha", e.target.value)}
                onBlur={() => handleBlur("fecha")}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                style={{ borderColor: errors.fecha && touched.fecha ? "red" : Colors.table.lines }}
              />
              {errors.fecha && touched.fecha && (
                <span className="text-red-500 text-xs mt-1">{errors.fecha}</span>
              )}
            </div>

            {/* Estado - Read only */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Estado
              </label>
              <input
                type="text"
                value="Pendiente"
                disabled
                className="w-full p-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600"
              />
            </div>
          </div>

          {/* Info proveedor */}
          {selectedSupplier && (
            <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded p-2 flex gap-4 flex-wrap">
              {selectedSupplier.email && <span>📧 {selectedSupplier.email}</span>}
              {selectedSupplier.phone && <span>📱 {selectedSupplier.phone}</span>}
              {!selectedSupplier.email && !selectedSupplier.phone && (
                <span className="text-amber-600 font-medium">
                  ⚠️ Sin contacto — la orden se guardará sin notificación
                </span>
              )}
            </div>
          )}
        </div>

        {/* Products Card */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex-1">
          <h3 className="mb-4 text-lg font-bold" style={{ color: Colors.texts.primary }}>
            Productos <span className="text-red-500">*</span>
          </h3>

          {loadingProducts && (
            <div className="text-xs text-blue-600 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Cargando productos del proveedor
            </div>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {rows.map((row, index) => (
              <div
                key={index}
                className="bg-gray-50 p-3 rounded-md border hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-800">
                        {row.productoNombre || "Sin producto seleccionado"}
                      </span>
                      {row.productId && (
                        <span className="bg-green-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                          ID {row.productId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Subtotal: ${(row.cantidad * row.precioUnitario).toLocaleString("es-CO")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="p-2 rounded hover:bg-red-100 transition shrink-0"
                    title="Eliminar"
                    disabled={rows.length === 1}
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Selector de producto */}
                  <div className="sm:col-span-2 relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Producto
                    </label>
                    {supplierProducts.length > 0 ? (
                      <>
                        <input
                          type="text"
                          value={row.productoNombre || ""}
                          onChange={(e) => handleProductSearchChange(index, e.target.value)}
                          onFocus={() => setDropdownOpen((prev) => ({ ...prev, [index]: true }))}
                          placeholder="Buscar producto..."
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                        />
                        {dropdownOpen[index] && (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {getFilteredProducts(productSearch[index] || "").length === 0 ? (
                              <p className="p-2 text-xs text-gray-500">No se encontraron productos</p>
                            ) : (
                              getFilteredProducts(productSearch[index] || "").map((p) => (
                                <div
                                  key={p.productid}
                                  onClick={() => handleProductSelect(index, p.productname)}
                                  className="px-2 py-1.5 cursor-pointer hover:bg-green-50 text-sm"
                                >
                                  {p.productname}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    ) : allProducts.length > 0 ? (
                      <>
                        <input
                          type="text"
                          value={productSearch[index] || row.productoNombre || ""}
                          onChange={(e) => {
                            setProductSearch((prev) => ({ ...prev, [index]: e.target.value }));
                            setDropdownOpen((prev) => ({ ...prev, [index]: true }));
                          }}
                          onFocus={() => setDropdownOpen((prev) => ({ ...prev, [index]: true }))}
                          placeholder="Buscar en todos los productos..."
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                        />
                        {dropdownOpen[index] && (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {allProducts
                              .filter((p) => p.name.toLowerCase().includes((productSearch[index] || "").toLowerCase()))
                              .slice(0, 10)
                              .map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => handleAllProductSelect(index, p)}
                                  className="px-2 py-1.5 cursor-pointer hover:bg-green-50 text-sm"
                                >
                                  {p.name}
                                </div>
                              ))}
                          </div>
                        )}
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Proveedor sin productos vinculados
                        </p>
                      </>
                    ) : (
                      <input
                        type="text"
                        value={row.productoNombre || ""}
                        onChange={(e) => handleManualProductChange(index, e.target.value)}
                        placeholder="Ingrese nombre del producto..."
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                      />
                    )}
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={row.cantidad}
                      min={1}
                      onChange={(e) => handleRowChange(index, "cantidad", Math.max(1, Number(e.target.value)))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Precio Unitario */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Precio Unitario
                    </label>
                    <input
                      type="number"
                      value={row.precioUnitario || ""}
                      min={0}
                      step={0.01}
                      onChange={(e) => handleRowChange(index, "precioUnitario", Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Imagen */}
                  <div className="flex flex-col items-center">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Imagen
                    </label>
                    {row.imagen ? (
                      <img
                        src={row.imagen}
                        alt={row.productoNombre}
                        className="h-10 w-10 object-cover rounded"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón agregar producto */}
          <button
            type="button"
            onClick={handleAddRow}
            className="cursor-pointer mt-4 w-full px-4 py-2 rounded-md text-white text-sm font-medium shadow hover:scale-[1.02] transition"
            style={{ backgroundColor: Colors.buttons.primary }}
          >
            Añadir producto +
          </button>
        </div>

        {/* Observaciones */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Observaciones
          </label>
          <textarea
            value={formData.descripcion || ""}
            onChange={(e) => handleInputChange("descripcion", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder="Ingrese observaciones (opcional)"
          />
        </div>
      </div>

      {/* Right Column: Totals & Actions */}
      <div className="md:w-[35%] flex flex-col gap-6">
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
              <span>IVA (19%)</span>
              <span className="font-medium text-gray-900">
                ${iva.toLocaleString("es-CO")}
              </span>
            </div>

            <div className="h-px bg-gray-200 my-4" />

            <div className="flex justify-between text-lg font-bold">
              <span style={{ color: Colors.texts.primary }}>Total </span>
              <span style={{ color: Colors.texts.primary }}>
                ${total.toLocaleString("es-CO")}
              </span>
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-start">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isSending}
              className="px-6 py-2 rounded-lg font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSendAndSave}
              disabled={isSending || isSubmitting || !selectedSupplier}
              className="px-6 py-2 rounded-lg font-medium text-white transition flex items-center justify-center"
              style={{ backgroundColor: "black" }}
            >
              {(isSending || isSubmitting) ? <Loader size="sm" /> : "Enviar al Proveedor y Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseOrderPage;

