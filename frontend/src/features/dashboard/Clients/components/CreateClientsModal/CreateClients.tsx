"use client";

import React from "react";
import { createPortal } from "react-dom";
import Colors from "@/shared/theme/colors";
import { useCreateClientForm } from "../../hooks/useClients";
import { CreateClientModalProps } from "../../types/typeClients";

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
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
    setFormData,
  } = useCreateClientForm({
    isOpen,
    onClose,
    onSave,
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 relative">
          <h2 className="text-xl font-semibold text-gray-800">
            Crear Cliente
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5"
          >
            <img src="/icons/X.svg" alt="Cerrar" className="w-5 h-5" />
          </button>
        </div>

        <div className="border-t border-gray-300" />

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Tipo Documento */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Tipo Documento
            </label>
            <select
              name="tipo"
              value={formData.tipo || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tipo: e.target.value ? Number(e.target.value) : 0,
                })
              }
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{
                borderColor:
                  errors.tipo && touched.tipo
                    ? "red"
                    : Colors.table.lines,
              }}
            >
              <option value="">Seleccione</option>
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
            <label className="block text-sm mb-1 text-gray-700">
              Número de Documento
            </label>
            <input
              type="text"
              name="documento"
              value={formData.documento}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {/* Nombres */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Nombres
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {/* Apellidos */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Apellidos
            </label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correoElectronico"
              value={formData.correoElectronico}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Estado
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Seleccione</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Ciudad
            </label>
            <input
              type="text"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {/* Código Postal */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Código Postal
            </label>
            <input
              type="text"
              name="codigoPostal"
              value={formData.codigoPostal}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {/* Botones */}
          <div className="col-span-1 sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-300 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-md text-sm bg-gray-400 text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-md text-sm bg-black text-white"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateClientModal;