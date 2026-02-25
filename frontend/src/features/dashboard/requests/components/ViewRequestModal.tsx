"use client";

import { useMemo } from "react";
import Modal from "@/features/dashboard/components/Modal";

type Tipo = "Mantenimiento" | "Instalacion";

type ViewRequestData = {
  tipos: Tipo[];
  servicio: string;
  descripcion: string;
  direccion: string;
  cliente: string;
  fecha: string;
  estado: string;
  codigo: string;
  programada: string | null;
  programadaEnd: string | null;
  tecnicos?: string[] | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  data: ViewRequestData;
};

function estadoClass(v: string) {
  const s = (v || "").toLowerCase();
  if (s.includes("aprob")) return "text-green-600 bg-green-50 border-green-200";
  if (s.includes("anul") || s.includes("cancel")) return "text-red-600 bg-red-50 border-red-200";
  if (s.includes("pend")) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  if (s.includes("activo")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  return "text-gray-700 bg-gray-50 border-gray-200";
}

function splitDateTime(value: string | null) {
  if (!value) return { date: "", time: "" };
  const trimmed = value.trim();
  if (!trimmed) return { date: "", time: "" };

  if (trimmed.includes("T")) {
    const [d, t] = trimmed.split("T");
    const time = (t || "").slice(0, 5);
    return { date: d, time };
  }

  if (trimmed.includes(" ")) {
    const [d, t] = trimmed.split(" ");
    const time = (t || "").slice(0, 5);
    return { date: d, time };
  }

  return { date: trimmed, time: "" };
}

export default function ViewRequestModal({
  isOpen,
  onClose,
  title = "Detalle de la Solicitud",
  data,
}: Props) {
  const { date: programadaDate, time: programadaTime } = useMemo(
    () => splitDateTime(data.programada),
    [data.programada]
  );

  const { date: programadaEndDate, time: programadaEndTime } = useMemo(
    () => splitDateTime(data.programadaEnd),
    [data.programadaEnd]
  );

  const tipoPrincipal: Tipo | null = useMemo(
    () => (Array.isArray(data.tipos) && data.tipos.length ? data.tipos[0] : null),
    [data.tipos]
  );

  const codigoMostrar = (data.codigo || "").trim() || "—";

  const tecnicos = useMemo(() => {
    const list = Array.isArray(data.tecnicos) ? data.tecnicos : [];
    return list.map((t) => String(t || "").trim()).filter(Boolean);
  }, [data.tecnicos]);

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Código: <span className="font-bold">{codigoMostrar}</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium",
                estadoClass(data.estado),
              ].join(" ")}
            >
              Estado: {data.estado || "—"}
            </span>

            <span className="inline-flex items-center rounded-full bg-gray-800 px-3 py-1 text-[11px] font-medium text-white">
              {tipoPrincipal ? `Tipo: ${tipoPrincipal}` : "Sin tipo asignado"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Cliente</label>
            <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900">
              <span className="truncate">{data.cliente || "—"}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Servicio</label>
            <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900">
              <span className="truncate">{data.servicio || "—"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Fecha de creación</label>
            <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900">
              <span>{data.fecha || "—"}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">
              Fecha y hora programada
            </label>
            <div className="flex h-10 items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900">
              <span>{programadaDate || "—"}</span>
              <span className="text-xs text-gray-500">{programadaTime ? `Hora: ${programadaTime}` : ""}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Fecha y hora final</label>
            <div className="flex h-10 items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900">
              <span>{programadaEndDate || "—"}</span>
              <span className="text-xs text-gray-500">{programadaEndTime ? `Hora: ${programadaEndTime}` : ""}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">Dirección</label>
            <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900">
              <span className="truncate">{data.direccion || "—"}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-900">Técnicos</label>

          {tecnicos.length ? (
            <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              {tecnicos.map((t, i) => (
                <span
                  key={`${t}-${i}`}
                  className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-900"
                  title={t}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900">
              <span className="truncate">—</span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-900">Descripción</label>
          <div className="min-h-[80px] whitespace-pre-line rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
            {data.descripcion?.trim() ? data.descripcion : "—"}
          </div>
        </div>
      </div>
    </Modal>
  );
}
