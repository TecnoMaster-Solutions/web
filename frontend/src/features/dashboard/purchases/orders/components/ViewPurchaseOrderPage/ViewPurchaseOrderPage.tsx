"use client";

import React from "react";
import Colors from "@/shared/theme/colors";
import { purchaseOrder as PurchaseOrderType } from "../../types/typesPurchaseOrder";

interface ViewPurchaseOrderPageProps {
  purchaseOrder: PurchaseOrderType | null;
  onClose: () => void;
}

export const ViewPurchaseOrderPage: React.FC<ViewPurchaseOrderPageProps> = ({
  purchaseOrder,
  onClose,
}) => {
  if (!purchaseOrder) return null;

  /* ============================= */
  /* CÁLCULOS FINANCIEROS */
  /* ============================= */

  const subtotal = purchaseOrder.items.reduce(
    (acc, item) => acc + item.cantidad * item.precioUnitario,
    0
  );

  const iva = subtotal * 0.19;
  const descuento = 0;
  const total = purchaseOrder.total ?? subtotal + iva - descuento;

  /* ============================= */
  /* UTILIDADES */
  /* ============================= */

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No especificada";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "No especificada";

    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getStateColor = (estado: string) => {
    switch (estado) {
      case "Pendiente":
        return Colors.states.warning;
      case "Pendiente":
        return Colors.states.error;
      case "Pendiente":
        return Colors.states.info;
      default:
        return Colors.states.inactive;
    }
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row h-full max-h-[calc(100vh-160px)] overflow-y-auto p-2">
      {/* Left Column: Details */}
      <div className="md:w-[65%] flex flex-col gap-6">
        
        {/* General Info Card */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="mb-4 text-lg font-bold" style={{ color: Colors.texts.primary }}>
            Información General
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">
                Número de Orden
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 font-mono">
                {purchaseOrder.numeroOrden}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">
                Estado
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    color: getStateColor(purchaseOrder.estado),
                    backgroundColor: `${getStateColor(
                      purchaseOrder.estado
                    )}20`
                  }}
                >
                  {purchaseOrder.estado}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">
                Proveedor
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                {purchaseOrder.proveedor}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">
                Fecha de Entrega
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                {purchaseOrder.fechaEntrega 
                  ? formatDate(purchaseOrder.fechaEntrega)
                  : "No especificada"
                }
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">
                Fecha de Creación
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                {purchaseOrder.fecha 
                  ? formatDate(purchaseOrder.fecha)
                  : "—"
                }
              </div>
            </div>
          </div>
        </div>

        {/* Products Card */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex-1">
          <h3 className="mb-4 text-lg font-bold" style={{ color: Colors.texts.primary }}>
            Productos
          </h3>

          {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {purchaseOrder.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-md border hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-800">
                          {item.producto || "Sin producto seleccionado"}
                        </span>
                        {item.productoId && (
                          <span className="bg-green-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                            ID {item.productoId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Subtotal: {formatCOP(item.cantidad * item.precioUnitario)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Producto (solo lectura) */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Producto
                      </label>
                      <div className="px-2 py-1.5 border border-gray-200 rounded text-sm bg-white">
                        {item.producto || "Sin nombre"}
                      </div>
                    </div>

                    {/* Cantidad */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Cantidad
                      </label>
                      <div className="px-2 py-1.5 border border-gray-200 rounded text-sm text-center bg-white">
                        {item.cantidad || 0}
                      </div>
                    </div>

                    {/* Precio Unitario */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Precio Unitario
                      </label>
                      <div className="px-2 py-1.5 border border-gray-200 rounded text-sm text-right bg-white">
                        {formatCOP(item.precioUnitario || 0)}
                      </div>
                    </div>

                    {/* Imagen */}
                    <div className="flex flex-col items-center">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Imagen
                      </label>
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.producto}
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay productos registrados
            </div>
          )}
        </div>

        {/* Observaciones */}
        {purchaseOrder.descripcion && (
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Observaciones
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 min-h-[60px]">
              {purchaseOrder.descripcion}
            </div>
          </div>
        )}

        {/* Info Extra */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ID:</strong> #{purchaseOrder.id}
          </p>
        </div>
      </div>

      {/* Right Column: Summary */}
      <div className="md:w-[35%] flex flex-col gap-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm sticky top-4">
          <h3 className="text-2xl font-bold mb-6" style={{ color: Colors.texts.primary }}>
            Resumen
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCOP(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">IVA (19%):</span>
              <span className="font-medium">{formatCOP(iva)}</span>
            </div>

            {descuento > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Descuento:</span>
                <span className="font-medium">-{formatCOP(descuento)}</span>
              </div>
            )}

            <div className="h-px bg-gray-200 my-4" />

            <div className="flex justify-between text-lg font-bold">
              <span style={{ color: Colors.texts.primary }}>TOTAL:</span>
              <span style={{ color: Colors.texts.primary }}>
                {formatCOP(total)}
              </span>
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-start">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPurchaseOrderPage;

