"use client";

import React from "react";
import Colors from "@/shared/theme/colors";
import Modal from "@/features/dashboard/components/Modal";
import { useCreateClientForm } from "../../hooks/useClients";
import { CreateClientModalProps } from "../../types/typeClients";

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clients,
}) => {
  const {
    formData,
    errors,
    touched,
    handleInputChange,
    handleBlur,
    handleSubmit,
  } = useCreateClientForm({
    isOpen,
    onClose,
    onSave,
    clients,
  });

  if (!isOpen) return null;

  return (
    <Modal
      title="Crear Cliente"
      isOpen={isOpen}
      onClose={onClose}
      widthClass="md:max-w-2xl"
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
          {/* Tipo Documento */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Tipo Documento
            </label>
            <select
              name="tipo"
              value={formData.tipo || ""}
              onChange={handleInputChange}
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
              placeholder="Número de documento"
              value={formData.documento}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{
                borderColor:
                  errors.documento && touched.documento
                    ? "red"
                    : Colors.table.lines,
              }}
            />
            {errors.documento && touched.documento && (
              <span className="text-red-500 text-xs">{errors.documento}</span>
            )}
          </div>

          {/* Nombres */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Nombres
            </label>
            <input
              type="text"
              name="nombre"
              placeholder="Ingrese su nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{
                borderColor:
                  errors.nombre && touched.nombre
                    ? "red"
                    : Colors.table.lines,
              }}
            />
            {errors.nombre && touched.nombre && (
              <span className="text-red-500 text-xs">{errors.nombre}</span>
            )}
          </div>

          {/* Apellidos */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Apellidos
            </label>
            <input
              type="text"
              name="apellido"
              placeholder="Ingrese su apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{
                borderColor:
                  errors.apellido && touched.apellido
                    ? "red"
                    : Colors.table.lines,
              }}
            />
            {errors.apellido && touched.apellido && (
              <span className="text-red-500 text-xs">{errors.apellido}</span>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              placeholder="Ingrese su Teléfono"
              value={formData.telefono}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{
                borderColor:
                  errors.telefono && touched.telefono
                    ? "red"
                    : Colors.table.lines,
              }}
            />
            {errors.telefono && touched.telefono && (
              <span className="text-red-500 text-xs">{errors.telefono}</span>
            )}
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correoElectronico"
              placeholder="Ingrese su correo"
              value={formData.correoElectronico}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{
                borderColor:
                  errors.correoElectronico && touched.correoElectronico
                    ? "red"
                    : Colors.table.lines,
              }}
            />
            {errors.correoElectronico && touched.correoElectronico && (
              <span className="text-red-500 text-xs">
                {errors.correoElectronico}
              </span>
            )}
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Ciudad
            </label>
            <input
              type="text"
              name="ciudad"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{
                borderColor:
                  errors.ciudad && touched.ciudad
                    ? "red"
                    : Colors.table.lines,
              }}
            />
            {errors.ciudad && touched.ciudad && (
              <span className="text-red-500 text-xs">{errors.ciudad}</span>
            )}
          </div>

          {/* Código Postal */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Código Postal
            </label>
            <input
              type="text"
              name="codigoPostal"
              placeholder="Código postal"
              value={formData.codigoPostal}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{
                borderColor:
                  errors.codigoPostal && touched.codigoPostal
                    ? "red"
                    : Colors.table.lines,
              }}
            />
            {errors.codigoPostal && touched.codigoPostal && (
              <span className="text-red-500 text-xs">{errors.codigoPostal}</span>
            )}
          </div>

          {/* Botones */}
          <div className="col-span-1 mt-2 flex justify-end gap-3 border-t border-gray-300 pt-4 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-md text-sm bg-gray-400 text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-md text-sm bg-[#2a9781] text-white"
            >
              Guardar
            </button>
          </div>
      </form>
    </Modal>
  );
};

export default CreateClientModal;

