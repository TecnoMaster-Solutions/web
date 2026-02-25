"use client";
import React from "react";
import "react-toastify/dist/ReactToastify.css";
import Colors from "@/shared/theme/colors";
import { CreateUserModalProps } from "../../types/typesUser";
import { useCreateUserForm } from "../../hooks/useCreateUserForm";
import { useDocumentTypes } from "../../hooks/useDocumentTypes";
import { useRoles } from "../../hooks/useRoles";
import { useTechnicianTypes } from "../../hooks/useTechnicianTypes";
import Modal from "@/features/dashboard/components/Modal";

const normalizeRoleName = (name: string) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  users,
}) => {
  const {
    formData,
    errors,
    touched,
    previewImage,
    previewCV,
    isSubmitting,
    isNit,
    handleInputChange,
    handleImageChange,
    handleCVChange,
    handleBlur,
    handleSubmit,
    removeImage,
    removeCV,
    handleTechnicianTypeChange,
  } = useCreateUserForm({ isOpen, onClose, onSave, users });

  const { documentTypes, loading: loadingDocuments } = useDocumentTypes();
  const { roles, loading: loadingRoles } = useRoles();
  const { technicianTypes, loading: loadingTechnicianTypes } =
    useTechnicianTypes();

  // Determinar el rol seleccionado
  const selectedRole =
    roles.find((r) => r.roleid === formData.roleid)?.name || "";
  const normalizedRole = normalizeRoleName(selectedRole);
  const isTecnico = normalizedRole === "tecnico";
  const isCliente = normalizedRole === "cliente";

  // Manejo inputs texto
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e.target.name as keyof typeof formData, e.target.value);
  };

  // Manejo selects
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const field = e.target.name as keyof typeof formData;
    const value = Number(e.target.value);
    handleInputChange(field, value);
  };

  const footer = (
    <div className="flex justify-end gap-2 sm:gap-3 w-full">
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
        disabled={isSubmitting}
      >
        Cancelar
      </button>

      <button
        type="submit"
        form="create-user-form"
        disabled={isSubmitting}
        className="cursor-pointer transition duration-300 hover:bg-black hover:text-white hover:scale-105 px-4 py-2 rounded-lg bg-black text-white w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Guardar
      </button>
    </div>
  );


  if (!isOpen) return null;

  return (
    <Modal
      title="Crear Usuario"
      isOpen={isOpen}
      onClose={onClose}
      footer={footer}
      widthClass="max-w-2xl"
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Documento */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Documento <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Tipo */}
            <select
              name="typeid"
              value={formData.typeid}
              onChange={handleSelectChange}
              onBlur={() => handleBlur("typeid")}
              className="w-full sm:w-32 px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
              style={{
                borderColor:
                  errors.typeid && touched.typeid ? "red" : Colors.table.lines,
              }}
            >
              <option value={0}>Seleccione tipo</option>
              {loadingDocuments ? (
                <option>Cargando...</option>
              ) : (
                documentTypes.map((doc) => (
                  <option
                    key={doc.typeofdocumentid}
                    value={doc.typeofdocumentid}
                  >
                    {doc.name}
                  </option>
                ))
              )}
            </select>

            {/* Numero */}
            <div className="flex-1 flex flex-col">
              <input
                type="text"
                name="documentnumber"
                placeholder={isNit ? "Nmero de NIT" : "Nmero de documento"}
                value={formData.documentnumber}
                onChange={handleTextChange}
                onBlur={() => handleBlur("documentnumber")}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
                style={{
                  borderColor:
                    errors.documentnumber && touched.documentnumber
                      ? "red"
                      : Colors.table.lines,
                }}
              />
              {errors.documentnumber && touched.documentnumber && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.documentnumber}
                </span>
              )}
            </div>
          </div>
        </div>


        {/* Nombre y Apellido */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-${isNit ? "1" : "2"} gap-4 transition-all duration-300`}
        >
          <div className={isNit ? "col-span-2" : ""}>
            <label className="block text-sm font-medium mb-1">
              {isNit ? "Nombre de la empresa" : "Nombre"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder={
                isNit ? "Ingrese el nombre de la empresa" : "Ingrese su nombre"
              }
              value={formData.name}
              onChange={handleTextChange}
              onBlur={() => handleBlur("name")}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
              style={{
                borderColor:
                  errors.name && touched.name ? "red" : Colors.table.lines,
              }}
            />
            {errors.name && touched.name && (
              <span className="text-red-500 text-xs mt-1">{errors.name}</span>
            )}
          </div>

          {/* Apellido oculto si es NIT */}
          {!isNit && (
            <div>
              <label className="block text-sm font-medium mb-1">Apellido</label>
              <input
                type="text"
                name="lastname"
                placeholder="Ingrese su apellido"
                value={formData.lastname || ""}
                onChange={handleTextChange}
                onBlur={() => handleBlur("lastname")}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
                style={{
                  borderColor:
                    errors.lastname && touched.lastname
                      ? "red"
                      : Colors.table.lines,
                }}
              />
              {errors.lastname && touched.lastname && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.lastname}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Telfono y Correo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {isNit ? "Teléfono de la empresa" : "Teléfono"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              placeholder={isNit ? "Ingrese Teléfono de la empresa" : "Ingrese su Teléfono"}
              value={formData.phone}
              onChange={handleTextChange}
              onBlur={() => handleBlur("phone")}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
              style={{
                borderColor:
                  errors.phone && touched.phone ? "red" : Colors.table.lines,
              }}
            />
            {errors.phone && touched.phone && (
              <span className="text-red-500 text-xs mt-1">{errors.phone}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {isNit ? "Correo de la empresa" : "Correo"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder={isNit ? "Ingrese correo de la empresa" : "Ingrese su correo"}
              value={formData.email}
              onChange={handleTextChange}
              onBlur={() => handleBlur("email")}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
              style={{
                borderColor:
                  errors.email && touched.email ? "red" : Colors.table.lines,
              }}
            />
            {errors.email && touched.email && (
              <span className="text-red-500 text-xs mt-1">{errors.email}</span>
            )}
          </div>
        </div>

        {/* Rol */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            name="roleid"
            value={formData.roleid}
            onChange={handleSelectChange}
            onBlur={() => handleBlur("roleid")}
            disabled={isNit}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 ${isNit ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            style={{
              borderColor:
                errors.roleid && touched.roleid
                  ? "red"
                  : Colors.table.lines,
            }}
          >
            <option value={0}>Seleccione un rol</option>
            {loadingRoles ? (
              <option>Cargando roles...</option>
            ) : roles.length === 0 ? (
              <option>No hay roles disponibles</option>
            ) : (
              roles.map((r) => (
                <option key={r.roleid} value={r.roleid}>
                  {r.name}
                </option>
              ))
            )}
          </select>
          {errors.roleid && touched.roleid && (
            <span className="text-red-500 text-xs mt-1">
              {errors.roleid}
            </span>
          )}
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-sm font-medium mb-1">Imagen</label>
          <div className="border border-dashed border-gray-300 rounded-md p-2 text-center flex flex-col items-center justify-center gap-2">
            {previewImage ? (
              <>
                <img
                  src={previewImage}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-xs text-red-500 underline"
                >
                  Eliminar imagen
                </button>
              </>
            ) : (
              <>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer text-xs text-gray-500"
                >
                  Haga clic para cargar imagen
                </label>
              </>
            )}
          </div>
        </div>

        {/* tecnico */}
        {isTecnico && (
          <>
            {/* CV */}
            <div>
              <label className="block text-sm font-medium mb-1">
                CV (PDF, DOC, DOCX) <span className="text-red-500">*</span>
              </label>
              <div
                className="border border-dashed rounded-md px-4 py-3 text-center flex flex-col items-center justify-center gap-2"
                style={{
                  borderColor:
                    errors.CV && touched.CV ? "red" : Colors.table.lines,
                }}
              >
                {previewCV ? (
                  <div className="flex flex-col items-center gap-1 text-sm text-gray-700">
                    <span>Archivo: {previewCV}</span>
                    <button
                      type="button"
                      onClick={removeCV}
                      className="text-xs text-red-500 underline"
                    >
                      Eliminar CV
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      id="cv-upload"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleCVChange}
                      onBlur={() => handleBlur("CV")}
                    />
                    <label
                      htmlFor="cv-upload"
                      className="w-full text-center text-sm text-gray-500 cursor-pointer"
                    >
                      Haga clic para cargar CV
                    </label>
                  </>
                )}
              </div>
              {errors.CV && touched.CV && (
                <span className="text-red-500 text-xs mt-1">{errors.CV}</span>
              )}
            </div>

            {/* Tipos de tecnico */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipos de técnico <span className="text-red-500">*</span>
              </label>
              {loadingTechnicianTypes ? (
                <p className="text-sm text-gray-500">Cargando tipos...</p>
              ) : technicianTypes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay tipos de técnico disponibles
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {technicianTypes.map((type) => {
                      const selected = Boolean(
                        formData.techniciantypeids?.includes(
                          type.techniciantypeid
                        )
                      );
                      return (
                        <button
                          type="button"
                          key={type.techniciantypeid}
                          onClick={() =>
                            handleTechnicianTypeChange(
                              type.techniciantypeid,
                              !selected
                            )
                          }
                          onBlur={() => handleBlur("techniciantypeids")}
                          className={`px-4 py-2 rounded-full border text-sm transition ${selected
                              ? "bg-red-600 text-white border-red-600 shadow-sm"
                              : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                            }`}
                          aria-pressed={selected}
                        >
                          {type.name}
                        </button>
                      );
                    })}
                  </div>
                  {errors.techniciantypeids && touched.techniciantypeids && (
                    <span className="text-red-500 text-xs mt-1 block">
                      {errors.techniciantypeids}
                    </span>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Cliente */}
        {isCliente && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customercity"
                placeholder="Ciudad"
                value={formData.customercity || ""}
                onChange={(e) =>
                  handleInputChange("customercity", e.target.value)
                }
                onBlur={() => handleBlur("customercity")}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
                style={{
                  borderColor:
                    errors.customercity && touched.customercity
                      ? "red"
                      : Colors.table.lines,
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Código Postal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerzipcode"
                placeholder="Código postal"
                value={formData.customerzipcode || ""}
                onChange={(e) =>
                  handleInputChange("customerzipcode", e.target.value)
                }
                onBlur={() => handleBlur("customerzipcode")}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500"
                style={{
                  borderColor:
                    errors.customerzipcode && touched.customerzipcode
                      ? "red"
                      : Colors.table.lines,
                }}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CreateUserModal;




