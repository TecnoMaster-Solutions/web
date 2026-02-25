"use client";
import React, { useRef } from "react";
import Modal from "../../../components/Modal";
import Colors from "@/shared/theme/colors";
import { useCreateCategoryForm } from "../../hooks/useCreateCategoryForm";
import { CreateCategoryModalProps } from "../../types/typeCategoryProducts";

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
}) => {
  const {
    formData,
    errors,
    touched,
    handleInputChange,
    handleIconChange,
    handleBlur,
    handleSubmit,
  } = useCreateCategoryForm({ isOpen, onClose, onSave, categories });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getIconPreviewUrl = (icon: File | string | null): string | null => {
    if (!icon) return null;
    if (typeof icon === "string") return icon;
    return URL.createObjectURL(icon);
  };

  const handleCircleClick = () => fileInputRef.current?.click();

  const handleRemoveIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = "";
    handleIconChange({ target: { files: null } } as React.ChangeEvent<HTMLInputElement>);
  };

  const footer = (
    <div className="flex justify-end gap-2 sm:gap-3 w-full">
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
      >
        Cancelar
      </button>

      <button
        type="submit"
        className="cursor-pointer transition duration-300 hover:bg-black hover:text-white hover:scale-105 px-4 py-2 rounded-lg bg-black text-white w-full sm:w-auto"
      >
        Guardar
      </button>
    </div>
  );


  return (
    <Modal
      title="Crear Categoría de Producto"
      isOpen={isOpen}
      onClose={onClose}
      widthClass="max-w-md"
      footer={null}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Icono */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Icono
          </label>
          <div className="flex flex-col items-center">
            <input
              type="file"
              name="icon"
              onChange={handleIconChange}
              className="hidden"
              id="icon-upload"
              accept="image/*"
              ref={fileInputRef}
            />

            {/* Círculo del icono */}
            <div
              className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors mb-2 cursor-pointer"
              onClick={handleCircleClick}
              style={{ borderColor: Colors.table.lines }}
            >
              {formData.icon ? (
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-white">
                  <img
                    src={getIconPreviewUrl(formData.icon) || ""}
                    alt="Icono de categoría"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              )}
            </div>

            {/* Texto e info */}
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {formData.icon
                  ? "Haga clic en el círculo para cambiar el icono"
                  : "Haga clic en el círculo para seleccionar un icono"}
              </div>

              {formData.icon && (
                <div className="flex flex-col items-center space-y-1">
                  <div className="text-xs text-green-600 font-medium">
                    {typeof formData.icon === "string"
                      ? "Icono cargado"
                      : formData.icon.name || "Icono seleccionado"}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveIcon}
                    className="text-red-500 text-xs hover:text-red-700 px-2 py-1 border border-red-200 rounded-md"
                    style={{ borderColor: Colors.states.nullable }}
                  >
                    Eliminar icono
                  </button>
                </div>
              )}
              {!formData.icon && (
                <div className="text-xs text-gray-500">(Opcional)</div>
              )}
            </div>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="Ingrese el nombre de la categoría del producto"
            value={formData.name}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            style={{
              borderColor: errors.name && touched.name ? "red" : Colors.table.lines,
            }}
          />
          {errors.name && touched.name && (
            <span className="text-red-500 text-xs mt-1">{errors.name}</span>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Descripción
          </label>
          <textarea
            name="description"
            placeholder="Ingrese la descripción de la categoría del producto"
            value={formData.description}
            onChange={handleInputChange}
            onBlur={handleBlur}
            rows={3}
            maxLength={255}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            style={{
              borderColor:
                errors.description && touched.description
                  ? "red"
                  : Colors.table.lines,
            }}
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {formData.description.length}/255
          </div>
          {errors.description && touched.description && (
            <span className="text-red-500 text-xs mt-1">
              {errors.description}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          {footer}
        </div>
      </form>
    </Modal>
  );
};

export default CreateCategoryModal;
