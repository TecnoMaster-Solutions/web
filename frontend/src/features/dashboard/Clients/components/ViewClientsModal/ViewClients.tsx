import React from "react";
import { createPortal } from "react-dom";
import Colors from "@/shared/theme/colors";
import { ViewClientModalProps } from "../../types/typeClients";

export const ViewClientModal: React.FC<ViewClientModalProps> = ({
  isOpen,
  client,
  onClose,
}) => {
  if (!isOpen || !client) return null;

  const getInitials = (name: string, apellido: string) => {
    const first = name?.charAt(0).toUpperCase() || "";
    const last = apellido?.charAt(0).toUpperCase() || "";
    return first + last;
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl relative">

        {/* Botón cerrar */}
        <button onClick={onClose} className="absolute top-4 right-4">
          <img src="/icons/X.svg" alt="Cerrar" className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-left font-semibold text-xl mb-2 text-black">
          Detalle Cliente
        </h2>
        <div className="w-full h-px bg-gray-300 mb-6"></div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: Colors.buttons.primary }}
          >
            {getInitials(client.nombre, client.apellido)}
          </div>
        </div>

        {/* Datos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Tipo Documento */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Tipo Documento
            </label>
            <div className="input-view">
              {client.tipo}
            </div>
          </div>

          {/* Número Documento */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Número de Documento
            </label>
            <div className="input-view">
              {client.documento}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Nombre
            </label>
            <div className="input-view">
              {client.nombre}
            </div>
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Apellido
            </label>
            <div className="input-view">
              {client.apellido}
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Teléfono
            </label>
            <div className="input-view">
              {client.telefono}
            </div>
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Correo Electrónico
            </label>
            <div className="input-view">
              {client.correoElectronico}
            </div>
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Ciudad
            </label>
            <div className="input-view">
              {client.ciudad || "—"}
            </div>
          </div>

          {/* Código Postal */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Código Postal
            </label>
            <div className="input-view">
              {client.codigoPostal || "—"}
            </div>
          </div>

          {/* Estado */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Estado
            </label>
            <div className="input-view">
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor:
                    client.estado === "Activo" ? "#e8f5e8" : "#f5e8e8",
                  color:
                    client.estado === "Activo"
                      ? Colors.states.success
                      : Colors.states.inactive,
                }}
              >
                {client.estado}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: Colors.buttons.quaternary,
              color: Colors.texts.quaternary,
            }}
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Utility class */}
      <style jsx>{`
        .input-view {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #f9fafb;
          font-size: 14px;
          color: #374151;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ViewClientModal;