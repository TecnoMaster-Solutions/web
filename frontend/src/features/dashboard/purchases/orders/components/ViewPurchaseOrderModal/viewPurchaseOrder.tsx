import React from "react";
import { createPortal } from "react-dom";
import Colors from "@/shared/theme/colors";
import { viewPurchaseOrderModalProps } from "../../types/typesPurchaseOrder";

export const ViewPurchaseOrderModal: React.FC<viewPurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder
}) => {
  if (!isOpen || !purchaseOrder) return null;

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificada";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getStateColor = (estado: string) => {
    switch (estado) {
      case "Completada":
        return Colors.states.success;
      case "Pendiente":
        return Colors.states.warning;
      case "Cancelada":
        return Colors.states.error;
      case "En Proceso":
        return Colors.states.info;
      default:
        return Colors.states.inactive;
    }
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative z-50 max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Ver Orden de Compra
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* INFO GENERAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Número de Orden
              </label>
              <div className="input-readonly">
                {purchaseOrder.numeroOrden}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Estado
              </label>
              <div className="input-readonly">
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
          </div>

          {/* PROVEEDOR Y FECHA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Proveedor
              </label>
              <div className="input-readonly">
                {purchaseOrder.proveedor}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Fecha de Entrega
              </label>
              <div className="input-readonly">
                {formatDate(purchaseOrder.fecha)}
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Detalles del Producto
            </h3>

            <div className="border rounded-md overflow-hidden bg-white mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Cant.
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Precio Unit.
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {item.producto}
                      </td>

                      <td className="px-3 py-2 text-sm text-center">
                        {item.cantidad}
                      </td>

                      <td className="px-3 py-2 text-sm text-right">
                        ${item.precioUnitario.toLocaleString("es-CO")}
                      </td>

                      <td className="px-3 py-2 text-sm text-right font-medium">
                        ${(item.cantidad * item.precioUnitario).toLocaleString(
                          "es-CO"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RESUMEN */}
            <div className="bg-white p-4 rounded border">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Resumen Financiero
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString("es-CO")}</span>
                </div>

                <div className="flex justify-between">
                  <span>IVA (19%):</span>
                  <span>${iva.toLocaleString("es-CO")}</span>
                </div>

                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>TOTAL:</span>
                  <span>${total.toLocaleString("es-CO")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* OBSERVACIONES */}
          {purchaseOrder.descripcion && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Observaciones
              </label>
              <div className="input-readonly min-h-[60px]">
                {purchaseOrder.descripcion}
              </div>
            </div>
          )}

          {/* INFO EXTRA */}
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm">
              <strong>ID:</strong> #{purchaseOrder.id}
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ViewPurchaseOrderModal;