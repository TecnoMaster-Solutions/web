"use client";

import React, { useRef, useState, useEffect } from "react";
import Modal from "@/features/dashboard/components/Modal";
import {
  DocumentType,
  EditTechnicianData,
  Technician,
  TechnicianState,
} from "../../types/typesTechnicians";
import {
  validateTechnicianField,
  validateTechnicianForm,
  TechnicianErrors,
} from "@/features/dashboard/technicians/validations/techniciansValidations";
import { showWarning } from "@/shared/utils/notifications";
import { Upload} from "lucide-react";
import { getDocumentTypes } from "../../api/typeofdocuments.api";

const states: TechnicianState[] = ["Activo", "Inactivo"];
const TECH_TYPES = ["Cableado estructurado", "Electricista", "Redes"];

function fileNameFromUrl(u?: string) {
  if (!u) return "";
  try {
    const url = new URL(u);
    const last = url.pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(last);
  } catch {
    const parts = u.split("?")[0].split("/").filter(Boolean);
    return decodeURIComponent(parts.pop() || "");
  }
}

interface EditTechnicianModalProps {
  isOpen: boolean;
  technician: Technician;
  technicians: Technician[];
  typeOptions?: string[];
  onClose: () => void;
  onUpdate: (data: EditTechnicianData) => void;
}

const EditTechnicianModal: React.FC<EditTechnicianModalProps> = ({
  isOpen,
  technician,
  technicians,
  typeOptions,
  onClose,
  onUpdate,
}) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentTypeId, setDocumentTypeId] = useState<number>(0);
  const [documentTypeName, setDocumentTypeName] = useState<string>("");

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<TechnicianState>("Activo");

  const [types, setTypes] = useState<string[]>([]);
  const [resumePdf, setResumePdf] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string>("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | undefined>(undefined);

  const [errors, setErrors] = useState<Partial<TechnicianErrors>>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    getDocumentTypes().then((data) => {
      const filtered = data.filter((d) => d.name !== "NIT");
      setDocumentTypes(filtered);

      const currentDoc = filtered.find((d) => d.name === technician.documentType);

      if (currentDoc) {
        setDocumentTypeId(currentDoc.typeofdocumentid);
        setDocumentTypeName(currentDoc.name);
      } else {
        setDocumentTypeId(filtered[0]?.typeofdocumentid ?? 0);
        setDocumentTypeName(filtered[0]?.name ?? "");
      }
    });
  }, [isOpen, technician]);

  const resetForm = () => {
    setName(technician.name);
    setLastName(technician.lastName);
    setDocumentNumber(technician.documentNumber);
    setPhone(technician.phone);
    setEmail(technician.email);
    setState(technician.state ?? "Activo");

    setTypes(technician.types ?? []);

    setResumePdf(null);
    setResumeName(fileNameFromUrl(technician.resumeUrl));

    setImageFile(null);
    setPreviewImage(technician.image);

    setErrors({});
    setImageError(null);
    setPdfError(null);
  };

  useEffect(() => {
    if (isOpen) resetForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, technician]);

  const handleFieldChange = (field: any, rawValue: any) => {
    let value = rawValue;

    if (field === "documentType") {
      const id = Number(rawValue);
      const doc = documentTypes.find((d) => d.typeofdocumentid === id);

      setDocumentTypeId(id);
      setDocumentTypeName(doc?.name ?? "");

      const docTypeError = validateTechnicianField(
        "documentType",
        doc?.name ?? "",
        technicians,
        { documentType: doc?.name, excludeId: technician.id }
      );

      setErrors((prev) => ({ ...prev, documentType: docTypeError }));
      return;
    }

    if (field === "name") value = String(rawValue).replace(/\d/g, "");
    if (field === "lastName") value = String(rawValue).replace(/\d/g, "");
    if (field === "phone") value = String(rawValue).replace(/\D/g, "");

    if (field === "documentNumber") {
      const raw = String(rawValue);

      if (documentTypeName === "PA") {
        value = raw.replace(/[^a-zA-Z0-9]/g, "");
      } else {
        value = raw.replace(/\D/g, "");
      }
    }

    switch (field) {
      case "name":
        setName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "documentNumber":
        setDocumentNumber(value);
        break;
      case "phone":
        setPhone(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "types":
        setTypes(value as string[]);
        break;
      case "resumePdf":
        setResumePdf(value as File | null);
        break;
    }

    const fieldError = validateTechnicianField(
      field,
      value,
      technicians,
      { documentType: documentTypeName, excludeId: technician.id }
    );

    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const handleToggleType = (opt: string) => {
    const next = types.includes(opt)
      ? types.filter((t) => t !== opt)
      : [...types, opt];

    setTypes(next);
    setTimeout(() => handleFieldChange("types", next), 0);
  };

  const validateImage = (file: File | null) => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) return "El archivo debe ser una imagen";
    if (file.size > 2 * 1024 * 1024) return "La imagen no debe superar 2MB";
    return null;
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
      const err = validateImage(file);
      if (err) {
        setImageError(err);
        setImageFile(null);
        setPreviewImage(technician.image);
        return;
      }
    }

    setImageError(null);
    setImageFile(file);
    setPreviewImage(file ? URL.createObjectURL(file) : technician.image);
  };

  const handlePdfChange = (file: File | null) => {
    if (!file) {
      setResumePdf(null);
      setResumeName(fileNameFromUrl(technician.resumeUrl));
      setPdfError(null);
      return;
    }

    if (file.type !== "application/pdf") return setPdfError("El archivo debe ser un PDF");
    if (file.size > 10 * 1024 * 1024) return setPdfError("El PDF no debe superar 10MB");

    setPdfError(null);
    setResumePdf(file);
    setResumeName(file.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: EditTechnicianData = {
      id: technician.id,
      name,
      lastName,
      documentType: documentTypeName,
      typeid: documentTypeId, 
      documentNumber,
      phone,
      email,
      state,
      image: imageFile || undefined,
      types,
      resumePdf: resumePdf || undefined,
    };

    const formErrors = validateTechnicianForm(updated, technicians, {
      excludeId: technician.id,
      requirePdf: false,
      hasExistingResume: Boolean(technician.resumeUrl),
    });

    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0 || imageError || pdfError) {
      showWarning("Por favor completa los campos obligatorios correctamente");
      return;
    }

    onUpdate(updated);
    resetForm();
    onClose();
  };

  return (
    <Modal
      title="Editar Técnico"
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-technician-form"
            className="cursor-pointer px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900"
          >
            Guardar
          </button>
        </div>
      }
    >
      <form id="edit-technician-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 p-1">
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Tipo de Documento <span className="text-red-500">*</span>
          </label>

          <select
            value={documentTypeId}
            onChange={(e) => handleFieldChange("documentType", e.target.value)}
            className="w-full px-2 py-1 border rounded-md"
          >
            {documentTypes.map((d) => (
              <option key={d.typeofdocumentid} value={d.typeofdocumentid}>{d.name}</option>
            ))}
          </select>

          {errors.documentType && (
            <p className="text-xs text-red-600 mt-1">{errors.documentType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Número de Documento *</label>
          <input
            type="text"
            value={documentNumber}
            onChange={(e) => handleFieldChange("documentNumber", e.target.value)}
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.documentNumber && (
            <p className="text-xs text-red-600 mt-1">{errors.documentNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Apellido *</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.lastName && (
            <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Teléfono *</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Correo *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            className="w-full px-2 py-1 border rounded-md"
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value as TechnicianState)}
            className="w-full px-2 py-1 border rounded-md"
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">
            Tipos de técnico *
          </label>

          <div className="flex flex-wrap gap-2">
            {(typeOptions ?? TECH_TYPES).map((opt) => {
              const active = types.includes(opt);

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleToggleType(opt)}
                  className={`px-3 py-1 rounded-full border text-sm transition ${
                    active
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
            <p className="text-xs text-red-600 mt-1">{errors.types}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Hoja de vida (PDF)
          </label>
          <div className="flex items-center gap-3">
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="flex h-10 min-w-10 max-w-[260px] items-center justify-center rounded-md border border-dashed border-gray-500 cursor-pointer px-2"
            >
              {resumePdf ? (
                <span className="text-xs truncate w-full">{resumeName}</span>
              ) : (
                <span className="text-xs truncate w-full">{resumeName || "Subir PDF"}</span>
              )}
            </div>

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handlePdfChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {pdfError && <p className="text-xs text-red-600 mt-1">{pdfError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Imagen</label>
          <div className="flex items-center gap-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-gray-500 cursor-pointer overflow-hidden"
            >
              {previewImage ? (
                <img src={previewImage} className="h-full w-full object-cover" />
              ) : (
                <Upload size={16} />
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default EditTechnicianModal;
