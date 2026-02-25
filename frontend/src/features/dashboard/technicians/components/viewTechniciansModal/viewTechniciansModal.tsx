"use client";

import React from "react";
import Modal from "@/features/dashboard/components/Modal";
import Colors from "@/shared/theme/colors";
import { Technician } from "../../types/typesTechnicians";

interface ViewTechnicianModalProps {
  isOpen: boolean;
  technician: Technician | null;
  onClose: () => void;
}

const rowLabel = "text-[13px] font-medium mb-0.5";
const rowBox =
  "px-2 py-1 border rounded-md bg-gray-50 text-[13px] leading-5 whitespace-nowrap overflow-hidden text-ellipsis";

const chip = "px-2.5 py-0.5 rounded-full border text-xs";
const chipOn = "bg-red-600 text-white border-red-600";
const chipOff = "bg-gray-100 text-gray-700 border-gray-300";

const ViewTechnicianModal: React.FC<ViewTechnicianModalProps> = ({
  isOpen,
  technician,
  onClose,
}) => {
  if (!technician) return null;

  const getInitials = (name: string, lastName: string) => {
    const firstInitial = name?.charAt(0)?.toUpperCase() ?? "";
    const lastInitial = lastName?.charAt(0)?.toUpperCase() ?? "";
    return `${firstInitial}${lastInitial}`;
  };

  const documento = `${technician.documentType ?? ""} ${
    technician.documentNumber ?? ""
  }`.trim();

  return (
    <Modal
      title="Detalle del Técnico"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2 sm:gap-3 p-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 p-1">
        <div className="col-span-2 lg:col-span-3 flex justify-center mb-1">
          <div
            className="w-16 h-16 rounded-full border flex items-center justify-center bg-gray-50 overflow-hidden text-gray-600 font-semibold text-base"
            style={{ backgroundColor: technician.image ? "transparent" : "#f3f4f6" }}
          >
            {technician.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={technician.image}
                alt={`${technician.name} ${technician.lastName}`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              getInitials(technician.name, technician.lastName)
            )}
          </div>
        </div>

        {/* Fila 1 */}
        <div>
          <label className={rowLabel} style={{ color: Colors.texts.primary }}>
            Nombre
          </label>
          <div className={rowBox}>{technician.name}</div>
        </div>

        <div>
          <label className={rowLabel} style={{ color: Colors.texts.primary }}>
            Apellido
          </label>
          <div className={rowBox}>{technician.lastName}</div>
        </div>

        <div>
          <label className={rowLabel} style={{ color: Colors.texts.primary }}>
            Documento
          </label>
          <div className={rowBox} title={documento || "—"}>
            {documento || "—"}
          </div>
        </div>

        <div>
          <label className={rowLabel} style={{ color: Colors.texts.primary }}>
            Teléfono
          </label>
          <div className={rowBox}>{technician.phone}</div>
        </div>

        <div>
          <label className={rowLabel} style={{ color: Colors.texts.primary }}>
            Correo electrónico
          </label>
          <div className={rowBox}>{technician.email}</div>
        </div>

        <div>
          <label className={rowLabel} style={{ color: Colors.texts.primary }}>
            Estado
          </label>
          <div className={rowBox}>{technician.state}</div>
        </div>

        <div className="col-span-2 lg:col-span-3 flex flex-col items-center">
          <label
            className={`${rowLabel} text-center`}
            style={{ color: Colors.texts.primary }}
          >
            Tipos de técnico
          </label>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-[640px]">
            {(technician.types ?? []).length ? (
              technician.types.map((t) => (
                <span key={t} className={`${chip} ${chipOn}`}>
                  {t}
                </span>
              ))
            ) : (
              <span className={`${chip} ${chipOff}`}>Sin especificar</span>
            )}
          </div>
        </div>

        <div>
          <label className={rowLabel} style={{ color: Colors.texts.primary }}>
            Hoja de vida (PDF)
          </label>
          {technician.resumeUrl ? (
            <a
              href={technician.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-1 rounded-md border bg-white hover:bg-gray-100 text-[13px]"
              title="Abrir hoja de vida"
            >
              Ver PDF
            </a>
          ) : (
            <div className={rowBox}>No cargada</div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewTechnicianModal;
