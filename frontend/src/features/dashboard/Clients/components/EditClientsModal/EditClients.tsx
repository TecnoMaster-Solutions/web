import React from "react";
import Colors from "@/shared/theme/colors";
import Modal from "@/features/dashboard/components/Modal";
import { useEditClientForm } from "../../hooks/useClients";
import { EditClientModalProps } from "../../types/typeClients";

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  client,
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
  } = useEditClientForm({ isOpen, client, onClose, onSave, clients });

  // "formData es posiblemente null"
  if (!isOpen || !client || !formData) return null;

  return (
    <Modal
      title="Editar Cliente"
      isOpen={isOpen}
      onClose={onClose}
      widthClass="md:max-w-2xl"
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
      >
          {/* Tipo Documento */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Tipo Documento
            </label>
            <select
              name="tipo"
              value={formData.tipo || 0}
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
              <option value={2}>PPT</option>
              <option value={3}>NIT</option>
              <option value={4}>PA</option>
              <option value={5}>CE</option>
              <option value={6}>VI</option>
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
              placeholder="Número de documento"
              value={formData.documento}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
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

          {/* Nombre */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              placeholder="Ingrese su nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
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

          {/* Apellido */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Apellido
            </label>
            <input
              type="text"
              name="apellido"
              placeholder="Ingrese su apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
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
            <label className="block text-sm text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              placeholder="Ingrese su Teléfono"
              value={formData.telefono}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
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
            <label className="block text-sm text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correoElectronico"
              placeholder="Ingrese su correo"
              value={formData.correoElectronico}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
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
              style={{
                borderColor:
                  errors.estado && touched.estado
                    ? "red"
                    : Colors.table.lines,
              }}
            >
              <option value="">Seleccione</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
            {errors.estado && touched.estado && (
              <span className="text-red-500 text-xs">{errors.estado}</span>
            )}
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Ciudad
            </label>
            <input
              type="text"
              name="ciudad"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
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
            <label className="block text-sm text-gray-700 mb-1">
              Código Postal
            </label>
            <input
              type="text"
              name="codigoPostal"
              placeholder="Código postal"
              value={formData.codigoPostal}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border rounded-lg text-sm"
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
          <div className="col-span-1 flex justify-end gap-3 border-t border-gray-300 pt-6 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm bg-gray-400 text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm bg-[#2a9781] text-white hover:bg-[#227a69] transition-colors"
            >
              Guardar
            </button>
          </div>
      </form>
    </Modal>
  );
};

export default EditClientModal;

