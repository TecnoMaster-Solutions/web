import React from "react";
import Colors from "@/shared/theme/colors";
import Modal from "@/features/dashboard/components/Modal";
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

  return (
    <Modal
      title="Detalle Cliente"
      isOpen={isOpen}
      onClose={onClose}
      widthClass="md:max-w-2xl"
    >
      <div className="flex justify-center mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
          style={{ backgroundColor: Colors.buttons.primary }}
        >
          {getInitials(client.nombre, client.apellido)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Tipo Documento
          </label>
          <div className="input-view">{client.tipo}</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Numero de Documento
          </label>
          <div className="input-view">{client.documento}</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Nombre
          </label>
          <div className="input-view">{client.nombre}</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Apellido
          </label>
          <div className="input-view">{client.apellido}</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Telefono
          </label>
          <div className="input-view">{client.telefono}</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Correo Electronico
          </label>
          <div className="input-view">{client.correoElectronico}</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Ciudad
          </label>
          <div className="input-view">{client.ciudad || "-"}</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Codigo Postal
          </label>
          <div className="input-view">{client.codigoPostal || "-"}</div>
        </div>

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
    </Modal>
  );
};

export default ViewClientModal;
