"use client";

import React, { useRef, useState, useEffect } from "react";
import Modal from "@/features/dashboard/components/Modal";
import Colors from "@/shared/theme/colors";
import {
  DocumentType,
  CreateTechnicianData,
  Technician,
} from "../../types/typesTechnicians";
import {
  validateTechnicianField,
  validateTechnicianForm,
  TechnicianErrors,
} from "@/features/dashboard/technicians/validations/techniciansValidations";
import { showWarning } from "@/shared/utils/notifications";
import { Upload, X } from "lucide-react";
import { getDocumentTypes } from "../../api/typeofdocuments.api";

type TechnicianField =
  | "documentType"
  | "documentNumber"
  | "name"
  | "lastName"
  | "phone"
  | "email"
  | "types"
  | "resumePdf";

interface CreateTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTechnicianData) => void;
  technicians: Technician[];
  typeOptions?: string[];
}

const TECH_TYPES = ["Cableado estructurado", "Electricista", "Redes"];

const removeBtnClass =
  "text-xs text-red-500 border border-red-300 rounded-md px-2 py-1 hover:bg-red-50 hover:text-red-700 flex items-center gap-1";

const CreateTechnicianModal: React.FC<CreateTechnicianModalProps> = ({
  isOpen,
  onClose,
  onSave,
  technicians,
  typeOptions,
}) => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<string>("");
  const [tipoDocumentoId, setTipoDocumentoId] = useState<number>(0);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);

  const [types, setTypes] = useState<string[]>([]);
  const [resumePdf, setResumePdf] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string>("");

  const [errors, setErrors] = useState<Partial<TechnicianErrors>>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setNombre("");
    setApellido("");
    setTipoDocumento("");
    setTipoDocumentoId(0);
    setNumeroDocumento("");
    setTelefono("");
    setCorreo("");
    setImagen(null);
    setPreviewImagen(null);
    setTypes([]);
    setResumePdf(null);
    setResumeName("");
    setErrors({});
    setImageError(null);
    setPdfError(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    resetForm();
    
    getDocumentTypes().then((data) => {
      const filtered = data.filter((d) => d.name !== "NIT");
      setDocumentTypes(filtered);

      if (filtered.length > 0) {
        setTipoDocumentoId(filtered[0].typeofdocumentid);
        setTipoDocumento(filtered[0].name);
      }
    });

  }, [isOpen]);

  const handleFieldChange = (field: TechnicianField, rawValue: any) => {
    let value = rawValue;
    const hasDigits = typeof rawValue === "string" && /\d/.test(rawValue);

    if (field === "documentType") {
      const id = Number(rawValue);
      const doc = documentTypes.find((d) => d.typeofdocumentid === id);

      setTipoDocumentoId(id);
      setTipoDocumento(doc?.name ?? "");

      const docTypeError = validateTechnicianField(
        "documentType",
        doc?.name ?? "",
        technicians,
        { documentType: doc?.name ?? "" }
      );
      setErrors((prev) => ({ ...prev, documentType: docTypeError }));

      return;
    }

    if (field === "name" || field === "lastName")
      value = String(rawValue).replace(/\d/g, "");

    if (field === "phone") value = String(rawValue).replace(/\D/g, "");

    if (field === "documentNumber") {
      const raw = String(rawValue);

      if (tipoDocumento === "PA") {
        value = raw.replace(/[^a-zA-Z0-9]/g, "");
      } else {
        value = raw.replace(/\D/g, "");
      }
    }

    switch (field) {
      case "name":
        setNombre(value);
        break;
      case "lastName":
        setApellido(value);
        break;
      case "documentNumber":
        setNumeroDocumento(value);
        break;
      case "phone":
        setTelefono(value);
        break;
      case "email":
        setCorreo(value);
        break;
      case "types":
        setTypes(value as string[]);
        break;
      case "resumePdf":
        setResumePdf(value as File | null);
        break;
    }

    let fieldError = validateTechnicianField(
      field,
      value,
      technicians,
      { documentType: tipoDocumento }
    );

    if ((field === "name" || field === "lastName") && hasDigits) {
      fieldError =
        field === "name"
          ? "El nombre no puede contener números"
          : "El apellido no puede contener números";
    }

    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const validateImage = (file: File | null) => {
    if (!file) return null;
    if (!file.type.startsWith("image/"))
      return "El archivo debe ser una imagen";
    if (file.size > 2 * 1024 * 1024) return "La imagen no debe superar 2MB";
    return null;
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
      const err = validateImage(file);
      if (err) {
        setImageError(err);
        setImagen(null);
        setPreviewImagen(null);
        return;
      }
    }
    setImageError(null);
    setImagen(file);
    setPreviewImagen(file ? URL.createObjectURL(file) : null);
  };

  const handlePdfChange = (file: File | null) => {
    if (!file) {
      setResumePdf(null);
      setResumeName("");
      setPdfError("La hoja de vida (PDF) es obligatoria");
      setErrors((p) => ({
        ...p,
        resumePdf: "La hoja de vida (PDF) es obligatoria",
      }));
      return;
    }
    if (file.type !== "application/pdf") {
      const msg = "El archivo debe ser un PDF";
      setPdfError(msg);
      setErrors((p) => ({ ...p, resumePdf: msg }));
      setResumePdf(null);
      setResumeName("");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      const msg = "El PDF no debe superar 10MB";
      setPdfError(msg);
      setErrors((p) => ({ ...p, resumePdf: msg }));
      setResumePdf(null);
      setResumeName("");
      return;
    }
    setPdfError(null);
    setErrors((p) => ({ ...p, resumePdf: undefined }));
    setResumePdf(file);
    setResumeName(file.name);
  };

  const handleToggleType = (option: string) => {
    setTypes((prev) =>
      prev.includes(option)
        ? prev.filter((t) => t !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData: CreateTechnicianData = {
      name: nombre,
      lastName: apellido,
      documentType: tipoDocumento,
      typeid: tipoDocumentoId,
      documentNumber: numeroDocumento,
      phone: telefono,
      email: correo,
      image: imagen || undefined,
      state: "Activo",
      types,
      resumePdf: resumePdf as File,
    };

    const formErrors = validateTechnicianForm(formData, technicians);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0 || imageError || pdfError) {
      showWarning("Por favor completa los campos obligatorios correctamente");
      return;
    }

    onSave(formData);
  };

  return (
    <Modal
      title="Crear Técnico"
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      footer={
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
            form="create-technician-form"
            className="cursor-pointer transition duration-300 hover:bg-black hover:text-white hover:scale-105 px-4 py-2 rounded-lg bg-black text-white w-full sm:w-auto"
          >
            Guardar
          </button>
        </div>
      }
    >
      <form
        id="create-technician-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full"
      >
        <div className="flex-1 grid grid-cols-2 gap-3 p-1">
          <div className="relative">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              Tipo de Documento <span className="text-red-500">*</span>
            </label>

            <select
              value={tipoDocumentoId}
              onChange={(e) =>
                handleFieldChange("documentType", e.target.value)
              }
              className="w-full px-2 py-1 border rounded-md"
              style={{
                borderColor: errors.documentType ? "red" : Colors.table.lines,
              }}
            >
              {documentTypes.map((doc) => (
                <option
                  key={doc.typeofdocumentid}
                  value={doc.typeofdocumentid}
                >
                  {doc.name}
                </option>
              ))}
            </select>

            {errors.documentType && (
              <p className="mt-1 text-xs text-red-600">
                {errors.documentType}
              </p>
            )}
          </div>

          <div className="relative">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              Número de Documento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Número de documento"
              value={numeroDocumento}
              onChange={(e) =>
                handleFieldChange("documentNumber", e.target.value)
              }
              onBlur={() =>
                handleFieldChange("documentNumber", numeroDocumento)
              }
              className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{
                borderColor: errors.documentNumber
                  ? "red"
                  : Colors.table.lines,
              }}
            />
            {errors.documentNumber && (
              <p className="mt-1 text-xs text-red-600">
                {errors.documentNumber}
              </p>
            )}
          </div>

          <div className="relative">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ingrese nombre"
              value={nombre}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              onBlur={() => handleFieldChange("name", nombre)}
              className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ borderColor: errors.name ? "red" : Colors.table.lines }}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="relative">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ingrese apellido"
              value={apellido}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
              onBlur={() => handleFieldChange("lastName", apellido)}
              className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{
                borderColor: errors.lastName ? "red" : Colors.table.lines,
              }}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">
                {errors.lastName}
              </p>
            )}
          </div>

          <div className="relative">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ingrese teléfono"
              value={telefono}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              onBlur={() => handleFieldChange("phone", telefono)}
              className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{
                borderColor: errors.phone ? "red" : Colors.table.lines,
              }}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          <div className="relative">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Correo@gmail.com"
              value={correo}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              onBlur={() => handleFieldChange("email", correo)}
              className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{
                borderColor: errors.email ? "red" : Colors.table.lines,
              }}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="col-span-2">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              Tipos de técnico <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {(typeOptions ?? TECH_TYPES).map((opt) => {
                const active = types.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      handleToggleType(opt);
                      setTimeout(
                        () =>
                          handleFieldChange(
                            "types",
                            types.includes(opt)
                              ? types.filter((t) => t !== opt)
                              : [...types, opt]
                          ),
                        0
                      );
                    }}
                    className={`px-3 py-1 rounded-full border text-sm transition ${active
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {errors.types && (
              <p className="mt-1 text-xs text-red-600">{errors.types}</p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              Hoja de vida (PDF) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div
                onClick={() => pdfInputRef.current?.click()}
                className="flex h-10 min-w-10 max-w-[260px] items-center justify-center rounded-md border border-dashed border-gray-500 text-gray-700 cursor-pointer hover:bg-gray-100 px-2"
                title={resumeName || "Subir PDF"}
              >
                {resumePdf ? (
                  <span className="text-xs truncate w-full">
                    {resumeName}
                  </span>
                ) : (
                  <Upload size={16} />
                )}
              </div>
              {resumePdf && (
                <button
                  type="button"
                  onClick={() => handlePdfChange(null)}
                  className={removeBtnClass}
                >
                  <X size={14} /> Eliminar
                </button>
              )}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) =>
                  handlePdfChange(e.target.files?.[0] ?? null)
                }
              />
            </div>
            {(pdfError || errors.resumePdf) && (
              <p className="mt-1 text-xs text-red-600">
                {pdfError || errors.resumePdf}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: Colors.texts.primary }}
            >
              Imagen
            </label>
            <div className="mt-1 flex items-center gap-2">
              <div
                onClick={() => imgInputRef.current?.click()}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-gray-500 text-gray-600 cursor-pointer overflow-hidden"
              >
                {previewImagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImagen}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Upload size={16} />
                )}
              </div>
              {imagen && (
                <button
                  type="button"
                  onClick={() => handleImageChange(null)}
                  className={removeBtnClass}
                >
                  <X size={14} /> Eliminar
                </button>
              )}
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleImageChange(e.target.files?.[0] ?? null)
                }
              />
            </div>
            {imageError && (
              <p className="mt-1 text-xs text-red-600">{imageError}</p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTechnicianModal;
