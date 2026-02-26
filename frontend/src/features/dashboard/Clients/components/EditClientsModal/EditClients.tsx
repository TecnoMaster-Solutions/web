import React from "react";
import { createPortal } from "react-dom";
import Colors from "@/shared/theme/colors";
import { useEditClientForm } from "../../hooks/useClients";
import { EditClientModalProps } from "../../types/typeClients";

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  client,
  onClose,
  onSave,
}) => {
  const {
    formData,
    errors,
    touched,
    handleInputChange,
    handleBlur,
    handleSubmit,
  } = useEditClientForm({ isOpen, client, onClose, onSave });

  // "formData es posiblemente null"
  if (!isOpen || !client || !formData) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative">

        {/* Header */}
        <div className="px-6 pt-6 pb-3 relative">
          <h2 className="text-2xl font-semibold text-gray-800">
            Editar Cliente
          </h2>
          <button onClick={onClose} className="absolute top-6 right-6">
            <img src="/icons/X.svg" alt="Cerrar" className="w-5 h-5" />
          </button>
        </div>

        <div className="border-t border-gray-300 mx-6" />

        <form
          onSubmit={handleSubmit}
          className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {/* Tipo Documento */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Tipo Documento
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{
                borderColor:
                  errors.tipo && touched.tipo
                    ? "red"
                    : Colors.table.lines,
              }}
            >
              <option value={0}>Seleccione</option>
              <option value={1}>CC</option>
              <option value={2}>TI</option>
              <option value={3}>CE</option>
              <option value={4}>PPN</option>
            </select>
            {errors.tipo && touched.tipo && (
              <span className="text-red-500 text-xs">{errors.tipo}</span>
            )}
          </div>

          {/* Número Documento */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Número de Documento
            </label>
            <input
              type="text"
              name="documento"
              value={formData.documento}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Apellido
            </label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correoElectronico"
              value={formData.correoElectronico}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Seleccione</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Ciudad
            </label>
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Código Postal */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Código Postal
            </label>
            <input
              type="text"
              name="codigoPostal"
              value={formData.codigoPostal}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Botones */}
          <div className="col-span-1 sm:col-span-2 flex justify-end gap-3 pt-6 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm bg-gray-400 text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm bg-black text-white"
            >
              Guardar
            </button>
          </div>
        </form>

        <div className="border-t border-gray-300 mx-6 mb-4" />
      </div>
    </div>,
    document.body
  );
};

export default EditClientModal;