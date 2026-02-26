"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import "react-toastify/dist/ReactToastify.css";
import Colors from "@/shared/theme/colors";
import { createPurchaseOrderModalProps } from "../../types/typesPurchaseOrder";
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
} from "../../services/suppliersOrderService";
import { showSuccess, showError, showWarning } from "@/shared/utils/notifications";

interface ItemRow {
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  imagen?: string;
}

export const CreatePurchaseOrderModal: React.FC<createPurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const {
    formData,
    errors,
    touched,
    handleInputChange,
    handleSupplierChange: handleSupplierChangeHook,
    handleBlur,
    handleSubmit,
    isSubmitting,
    setItems,
  } = useCreatePurchaseOrderForm({ isOpen, onClose, onSave });

  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<ProductoAPI[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [rows, setRows] = useState<ItemRow[]>([
    { productoNombre: "", cantidad: 1, precioUnitario: 0 },
  ]);

  // Cargar proveedores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setOrderNumber(generateOrderNumber());
      setSelectedSupplier(null);
      setSupplierProducts([]);
      setRows([{ productoNombre: "", cantidad: 1, precioUnitario: 0 }]);
      getSuppliers()
        .then((data) => setSuppliers(data))
        .catch(() => showError("Error al cargar proveedores."));
    }
  }, [isOpen]);

  // Sincronizar rows → formData.items
  // NOTA: setItems está envuelto en useCallback en el hook (referencia estable)
  useEffect(() => {
    setItems(
      rows.map((r) => ({
        producto: r.productoNombre,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        imagen: r.imagen,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]); // setItems es estable (useCallback), pero lo excluimos para evitar loops

  // ── Seleccionar proveedor ──────────────────────────────────────────────────
  const handleSupplierChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const supplierId = Number(e.target.value);

      if (!supplierId) {
        setSelectedSupplier(null);
        setSupplierProducts([]);
        // Limpiar campo proveedor en el formulario
        handleInputChange("proveedor", "");
        return;
      }

      const found = suppliers.find((s) => s.supplierid === supplierId);
      setSelectedSupplier(found || null);

      if (found) {
        // ✅ Guardar el NOMBRE y el ID del proveedor en el hook
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
    [suppliers, handleInputChange]
  );

  // ── Manejo de filas de productos ──────────────────────────────────────────
  const handleProductSelect = (index: number, productName: string) => {
    const prod = supplierProducts.find((p) => p.productname === productName);
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
            productoNombre: productName,
            cantidad: row.cantidad,
            precioUnitario: prod?.productpriceofsupplier ?? row.precioUnitario,
            imagen: prod?.image ?? undefined,
          }
          : row
      )
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
    setRows((prev) => [...prev, { productoNombre: "", cantidad: 1, precioUnitario: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Enviar + guardar ───────────────────────────────────────────────────────
  const handleSendAndSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      showError("Seleccione un proveedor antes de enviar.");
      return;
    }

    const validRows = rows.filter((r) => r.productoNombre.trim());
    if (validRows.length === 0) {
      showError("Debe agregar al menos un producto antes de enviar.");
      return;
    }

    const subtotal = rows.reduce((acc, r) => acc + r.cantidad * r.precioUnitario, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    const hasContact = selectedSupplier.email || selectedSupplier.phone;

    if (hasContact) {
      setIsSending(true);
      try {
        const result = await sendPurchaseOrderNotification({
          numeroOrden: orderNumber,
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
        });

        if (result.success) {
          showSuccess(
            `Notificación enviada por ${result.channel === "both"
              ? "WhatsApp y correo"
              : result.channel === "email"
                ? "correo"
                : "WhatsApp"
            }.`
          );
        }
      } catch {
        showWarning("No se pudo enviar la notificación, pero la orden se guardará.");
      } finally {
        setIsSending(false);
      }
    } else {
      showWarning("El proveedor no tiene contacto registrado. La orden se guardará sin notificación.");
    }

    handleSubmit();
  };

  if (!isOpen) return null;

  const subtotal = rows.reduce((acc, r) => acc + r.cantidad * r.precioUnitario, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl relative z-50 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Crear Orden de Compra</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSendAndSave} className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* N° ORDEN */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">N° Orden (Auto)</label>
              <input
                type="text"
                value={orderNumber}
                readOnly
                tabIndex={-1}
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed select-none"
              />
            </div>

            {/* PROVEEDOR */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Proveedor*</label>
              <select
                value={selectedSupplier?.supplierid?.toString() ?? ""}
                onChange={handleSupplierChange}
                onBlur={() => handleBlur("proveedor")}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
                style={{
                  borderColor: errors.proveedor && touched.proveedor ? "red" : Colors.table.lines,
                }}
              >
                <option value="">Seleccione un proveedor</option>
                {suppliers.map((s) => (
                  <option key={s.supplierid} value={s.supplierid}>{s.name}</option>
                ))}
              </select>
              {errors.proveedor && touched.proveedor && (
                <span className="text-red-500 text-xs mt-1">{errors.proveedor}</span>
              )}
            </div>

            {/* FECHA */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Fecha estimada de entrega</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange("fecha", e.target.value)}
                onBlur={() => handleBlur("fecha")}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
                style={{ borderColor: errors.fecha && touched.fecha ? "red" : Colors.table.lines }}
              />
              {errors.fecha && touched.fecha && (
                <span className="text-red-500 text-xs mt-1">{errors.fecha}</span>
              )}
            </div>

            {/* ESTADO */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Estado</label>
              <input
                type="text"
                value="Pendiente"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>
          </div>

          {/* Info proveedor */}
          {selectedSupplier && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 flex gap-4 flex-wrap">
              {selectedSupplier.email && <span>📧 {selectedSupplier.email}</span>}
              {selectedSupplier.phone && <span>📱 {selectedSupplier.phone}</span>}
              {!selectedSupplier.email && !selectedSupplier.phone && (
                <span className="text-amber-600 font-medium">
                  ⚠️ Sin contacto — la orden se guardará sin notificación
                </span>
              )}
            </div>
          )}

          {/* TABLA DE PRODUCTOS */}
          <div>
            {loadingProducts && (
              <div className="text-xs text-blue-600 mb-2 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Cargando productos del proveedor…
              </div>
            )}

            <div className="border border-gray-300 rounded-md overflow-hidden">
              <div className="grid grid-cols-[2fr_80px_90px_110px_100px_36px] gap-2 p-3 bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <div>Producto</div>
                <div>Imagen</div>
                <div className="text-center">Cant.</div>
                <div className="text-right">Precio Unit.</div>
                <div className="text-right">Subtotal</div>
                <div />
              </div>

              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[2fr_80px_90px_110px_100px_36px] gap-2 p-3 items-center border-b last:border-b-0 hover:bg-gray-50"
                >
                  {/* Selector / input de producto */}
                  <div>
                    {supplierProducts.length > 0 ? (
                      <select
                        value={row.productoNombre}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">— Seleccionar producto —</option>
                        {supplierProducts.map((p) => (
                          <option key={p.productid} value={p.productname}>{p.productname}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={row.productoNombre}
                        onChange={(e) => handleRowChange(index, "productoNombre", e.target.value)}
                        placeholder="Nombre del producto"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500"
                      />
                    )}
                  </div>

                  {/* Imagen */}
                  <div className="flex items-center justify-center">
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

                  {/* Cantidad */}
                  <div>
                    <input
                      type="number"
                      value={row.cantidad}
                      min={1}
                      onChange={(e) => handleRowChange(index, "cantidad", Math.max(1, Number(e.target.value)))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Precio */}
                  <div>
                    <input
                      type="number"
                      value={row.precioUnitario || ""}
                      min={0}
                      step={0.01}
                      onChange={(e) => handleRowChange(index, "precioUnitario", Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Total fila */}
                  <div className="text-sm font-medium text-right text-gray-700">
                    ${(row.cantidad * row.precioUnitario).toLocaleString("es-CO")}
                  </div>

                  {/* Eliminar */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="text-gray-300 hover:text-red-500 text-lg font-bold leading-none"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              <div className="p-3 bg-gray-50 border-t">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Agregar Producto
                </button>
              </div>
            </div>
          </div>

          {/* RESUMEN */}
          <div className="bg-gray-50 p-4 rounded-md space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>IVA (19%):</span>
              <span>${iva.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
              <span>TOTAL:</span>
              <span>${total.toLocaleString("es-CO")}</span>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Observaciones</label>
            <textarea
              value={formData.descripcion || ""}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSending || isSubmitting || !selectedSupplier}
              className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-md disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              {(isSending || isSubmitting) && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isSending ? "Enviando…" : isSubmitting ? "Guardando…" : "Enviar al Proveedor y Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreatePurchaseOrderModal;