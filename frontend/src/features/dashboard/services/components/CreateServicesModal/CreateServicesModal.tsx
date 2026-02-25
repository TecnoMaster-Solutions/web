"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import Colors from "@/shared/theme/colors";
import { Service, CreateServicePayload } from "../../types/typesServices";
import { getServiceTypes, ServiceTypeApi } from "../../api/services.api";
import { showWarning } from "@/shared/utils/notifications";

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateServicePayload) => void | Promise<void>;
  services: Service[];
}

const toTitleCase = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

type Errors = Partial<Record<"name" | "typeofserviceid" | "image", string>>;

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  services,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [typeofserviceid, setTypeofserviceid] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [image, setImage] = useState<File | string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [types, setTypes] = useState<ServiceTypeApi[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const selectedTypeName = useMemo(() => {
    const t = types.find((x) => x.typeofserviceid === typeofserviceid);
    return t?.name ?? "";
  }, [types, typeofserviceid]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setTypeofserviceid(0);
    setCategory("");
    setImage(null);
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    setLoadingTypes(true);
    getServiceTypes()
      .then((list) => setTypes(Array.isArray(list) ? list : []))
      .catch(() => setTypes([]))
      .finally(() => setLoadingTypes(false));
  }, [isOpen]);

  const validate = (): boolean => {
    const next: Errors = {};

    const trimmed = name.trim();
    if (!trimmed) next.name = "El nombre es obligatorio";

    const exists = services.some(
      (s) =>
        (s.name ?? "").trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (trimmed && exists) next.name = "Ya existe un servicio con este nombre";

    if (!typeofserviceid)
      next.typeofserviceid = "Debe seleccionar un tipo de servicio";

    if (!image || (typeof image === "string" && !image.trim()))
      next.image = "La imagen es obligatoria";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showWarning("Por favor completa los campos requeridos");
      return;
    }

    const finalCategory = toTitleCase(selectedTypeName || category);

    const data: CreateServicePayload = {
      name: name.trim(),
      description: description?.trim() || "",
      image,
      typeofserviceid,
    };

    await onSave(data);
    resetForm();
    onClose();
  };

  const handleCircleClick = () => fileInputRef.current?.click();
  const imageName = image instanceof File ? image.name : "";

  return (
    <Modal
      title="Crear Servicio"
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      footer={
        <>
          <div className="border-t border-gray-300 mt-3 mb-2"></div>
          <div className="flex justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="create-service-form"
              className="cursor-pointer transition duration-300 hover:bg-black hover:text-white hover:scale-105 px-4 py-2 rounded-lg bg-black text-white w-full sm:w-auto"
            >
              Guardar
            </button>
          </div>
        </>
      }
    >
      <form
        id="create-service-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-3 p-1"
      >
        <div className="col-span-2 flex flex-col items-center mb-3">
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Imagen <span className="text-red-500">*</span>
          </label>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setImage(file);
              setErrors((p) => ({
                ...p,
                image: file ? undefined : "La imagen es obligatoria",
              }));
            }}
          />

          <div
            className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer mb-1 overflow-hidden"
            onClick={handleCircleClick}
            style={{ borderColor: errors.image ? "red" : Colors.table.lines }}
          >
            {image ? (
              <img
                src={image instanceof File ? URL.createObjectURL(image) : image}
                alt="Servicio"
                className="w-full h-full object-cover rounded-full"
              />
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

          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              Haga clic en el círculo para{" "}
              {image ? "cambiar" : "seleccionar"} la imagen
            </div>

            {image && (
              <div className="flex flex-col items-center space-y-1">
                {imageName && (
                  <div className="text-xs text-green-600 font-medium">
                    {imageName}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setErrors((p) => ({ ...p, image: "La imagen es obligatoria" }));
                  }}
                  className="text-red-500 text-xs hover:text-red-700 px-2 py-1 border border-red-200 rounded-md"
                  style={{ borderColor: Colors.states.nullable }}
                >
                  Eliminar imagen
                </button>
              </div>
            )}

            {errors.image && (
              <span className="text-xs text-red-500 mt-1">{errors.image}</span>
            )}
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ingrese nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => validate()}
            className="w-full px-2 py-1 border rounded-md"
            style={{ borderColor: errors.name ? "red" : Colors.table.lines }}
          />
          {errors.name && (
            <span className="text-xs text-red-500">{errors.name}</span>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Tipo de servicio <span className="text-red-500">*</span>
          </label>
          <select
            value={typeofserviceid || ""}
            onChange={(e) => {
              const id = Number(e.target.value || 0);
              setTypeofserviceid(id);
              setCategory(
                toTitleCase(types.find((t) => t.typeofserviceid === id)?.name ?? "")
              );
              setErrors((p) => ({
                ...p,
                typeofserviceid: id
                  ? undefined
                  : "Debe seleccionar un tipo de servicio",
              }));
            }}
            className="w-full px-2 py-1 border rounded-md"
            style={{
              borderColor: errors.typeofserviceid ? "red" : Colors.table.lines,
            }}
          >
            <option value="">{loadingTypes ? "Cargando..." : "Seleccione tipo"}</option>
            {types.map((t) => (
              <option key={t.typeofserviceid} value={t.typeofserviceid}>
                {toTitleCase(t.name)}
              </option>
            ))}
          </select>
          {errors.typeofserviceid && (
            <span className="text-xs text-red-500">{errors.typeofserviceid}</span>
          )}
        </div>

        <div className="col-span-2">
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: Colors.texts.primary }}
          >
            Descripción
          </label>
          <textarea
            placeholder="Ingrese descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-2 py-1 border rounded-md resize-none"
            style={{ borderColor: Colors.table.lines }}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateServiceModal;
