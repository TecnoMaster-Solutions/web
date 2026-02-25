"use client";
import React from "react";
import Modal from "../../../components/Modal";
import Colors from "@/shared/theme/colors";
import { useViewCategory } from "../../hooks/useViewCategory";
import { ViewCategoryModalProps } from "../../types/typeCategoryProducts";

const ViewCategoryModal: React.FC<ViewCategoryModalProps> = ({
  isOpen,
  category,
  onClose,
}) => {
  const { currentIcon } = useViewCategory(category);

  if (!isOpen || !category) return null;

  //  Obtener URL del icono
  const getIconUrl = () => {
    if (!currentIcon) return null;
    if (currentIcon instanceof File) return URL.createObjectURL(currentIcon);
    if (typeof currentIcon === "string") return currentIcon;
    return null;
  };

  const iconUrl = getIconUrl();

  // Footer del modal
  const footer = (
    <div className="flex justify-end w-full">
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
      >
        Cerrar
      </button>
    </div>
  );


  return (
    <Modal
      title="Ver Categoría de Producto"
      isOpen={isOpen}
      onClose={onClose}
      widthClass="max-w-md"
      footer={footer}
    >
      <div className="space-y-4">
        {/* Icono */}
        <div className="flex flex-col items-center">
          {iconUrl ? (
            <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-50 mb-2">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-white">
                <img
                  src={iconUrl}
                  alt="Icono de categoría"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 mb-2">
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
            </div>
          )}

          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              {iconUrl
                ? "Icono de la categoría"
                : "No hay icono seleccionado"}
            </div>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Nombre
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
            <span className="text-gray-700">{category.name}</span>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Descripción
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[80px]">
            <span className="text-gray-700 whitespace-pre-wrap">
              {category.description?.trim()
                ? category.description
                : "No hay descripción"}
            </span>
          </div>
        </div>

        {/* Estado */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Estado
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${category.status
                ? "text-green-600 bg-green-100"
                : "text-gray-500 bg-gray-100"
                }`}
            >
              {category.status ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewCategoryModal;
