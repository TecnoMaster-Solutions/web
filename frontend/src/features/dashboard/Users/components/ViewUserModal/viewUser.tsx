"use client";
import React, { useEffect, useState } from "react";
import Colors from "@/shared/theme/colors";
import { ViewUserModalProps } from "../../types/typesUser";
import Modal from "@/features/dashboard/components/Modal";

const normalizeRoleName = (name: string) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const ViewUserModal: React.FC<ViewUserModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const stateMap: Record<number, string> = {
    1: "Activo",
    2: "Inactivo",
  };

  useEffect(() => {
    setImageUrl(user?.image || null);
  }, [user?.image]);

  if (!isOpen || !user) return null;

  const documentTypeName =
    user.typeofdocuments?.name || "Sin tipo de documento";

  // Detectar si es NIT (empresa)
  const isNit =
    documentTypeName?.toLowerCase().includes("nit") ||
    user.lastname === null ||
    user.lastname === "";

  // Detectar rol
  const roleName = normalizeRoleName(user.roles?.name || "");
  const isTecnico = roleName === "tecnico";
  const isCliente = roleName === "cliente";

  // Extraer datos
  const technician = user.technicians?.[0];
  const customer = user.customers?.[0];

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
      title="Ver Usuario"
      isOpen={isOpen}
      onClose={onClose}
      widthClass="max-w-2xl"
      footer={footer}
    >
      <div className="space-y-5">
        {/* Imagen */}
        <div className="flex flex-col items-center">
          {imageUrl ? (
            <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-50 mb-2 overflow-hidden">
              <img
                src={imageUrl}
                alt="Foto de usuario"
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 mb-2">
              <span className="text-gray-500 text-xl font-medium">
                {user.name.charAt(0)}
                {user.lastname?.charAt(0) || ""}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500">
            {imageUrl ? "Foto de perfil" : "Sin imagen"}
          </p>

          {/* Badge tipo de persona */}
          <div className="mt-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${isNit
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
                }`}
            >
              {isNit ? "Empresa (NIT)" : "Persona natural"}
            </span>
          </div>
        </div>

        {/* Documento */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Documento
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {documentTypeName}
            </div>
            <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {user.documentnumber}
            </div>
          </div>
        </div>

        {/* Nombre y Apellido */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-${isNit ? "1" : "2"} gap-4 transition-all duration-300`}
        >
          <div className={isNit ? "col-span-2" : ""}>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              {isNit ? "Nombre de la empresa" : "Nombre"}
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {user.name || ""}
            </div>
          </div>

          {!isNit && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: Colors.texts.primary }}
              >
                Apellido
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {user.lastname || ""}
              </div>
            </div>
          )}
        </div>

        {/* Telfono y Correo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              {isNit ? "Telfono de la empresa" : "Telfono"}
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {user.phone}
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              {isNit ? "Correo de la empresa" : "Correo electrnico"}
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 break-all">
              {user.email}
            </div>
          </div>
        </div>

        {/* Rol */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Rol
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
            {user.roles?.name || "Sin rol"}
          </div>
        </div>

        {/* Informacin para Tcnico */}
        {isTecnico && technician && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">
              Informacin de Técnico
            </h3>

            {technician.CV && (
              <div>
                <label className="block text-sm font-medium mb-1">CV</label>
                <a
                  href={technician.CV}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Ver currculum
                </a>
              </div>
            )}

            {Array.isArray(technician.technicianTypeMaps) &&
              technician.technicianTypeMaps.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipos de técnico
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {technician.technicianTypeMaps.map((tm, index) => (
                      <span
                        key={`${tm.techniciantypeid}-${index}`}
                        className="px-4 py-2 rounded-full text-sm border bg-red-600 text-white border-red-600 shadow-sm"
                      >
                        {tm.techniciantype?.name ||
                          `Tipo ID: ${tm.techniciantypeid}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Informacin para Cliente */}
        {isCliente && customer && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">
              Informacin de Cliente
            </h3>

            {customer.customercity && (
              <div>
                <label className="block text-sm font-medium mb-1">Ciudad</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {customer.customercity}
                </div>
              </div>
            )}

            {customer.customerzipcode && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cdigo Postal
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {customer.customerzipcode}
                </div>
              </div>
            )}
          </div>
        )}

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
              className={`rounded-full px-2 py-1 text-xs font-semibold ${user.stateid === 1
                  ? "text-green-600 bg-green-100"
                  : "text-gray-600 bg-gray-100"
                }`}
            >
              {stateMap[user.stateid] || "Desconocido"}
            </span>
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user.createat && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: Colors.texts.primary }}
              >
                Creado el
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {new Date(user.createat).toLocaleString("es-ES")}
              </div>
            </div>
          )}
          {user.updateat && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: Colors.texts.primary }}
              >
                Actualizado el
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {new Date(user.updateat).toLocaleString("es-ES")}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewUserModal;
