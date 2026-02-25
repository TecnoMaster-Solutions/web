"use client";

import type { AppointmentPalette } from "../types/typeAppointment";

export const appointmentStatePalette: Record<string, AppointmentPalette> = {
  activo: { background: "#059669", border: "#047857", text: "#dcfce7" },
  pendiente: { background: "#fbbf24", border: "#d97706", text: "#78350f" },
  anulada: { background: "#dc2626", border: "#b91c1c", text: "#fee2e2" },
  garantia: { background: "#0ea5e9", border: "#0284c7", text: "#e0f2fe" },
  garantiareportada: { background: "#0369a1", border: "#075985", text: "#e0f2fe" },
  finalizado: { background: "#10b981", border: "#047857", text: "#ecfdf5" },
  cancelado: { background: "#dc2626", border: "#991b1b", text: "#fee2e2" },
  "en-progreso": { background: "#f97316", border: "#c2410c", text: "#fff7ed" },
  agendado: { background: "#f472b6", border: "#be185d", text: "#fff1f2" },
};

const STATE_LABELS: Record<string, string> = {
  activo: "Activo",
  pendiente: "Pendiente",
  anulada: "Anulada",
  garantia: "Garantia",
  garantiareportada: "Garantia reportada",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
  "en-progreso": "En progreso",
  agendado: "Agendada",
};

const STATE_ALIASES: Record<string, keyof typeof appointmentStatePalette> = {
  cancel: "cancelado",
  canceled: "cancelado",
  cancelled: "cancelado",
  finish: "finalizado",
  finished: "finalizado",
  finalized: "finalizado",
  pendient: "pendiente",
  pending: "pendiente",
  inprocess: "en-progreso",
  "in-process": "en-progreso",
  enprogreso: "en-progreso",
  "en-progreso": "en-progreso",
  inprogress: "en-progreso",
  agendada: "agendado",
  agendado: "agendado",
  scheduled: "agendado",
};

export const normalizeStateKey = (value?: string | null) =>
  (value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

export const getStatePalette = (value?: string | null): AppointmentPalette => {
  const rawKey = normalizeStateKey(value);
  const key = STATE_ALIASES[rawKey] ?? rawKey;
  return (
    appointmentStatePalette[key] ?? {
      background: "#e5e7eb",
      border: "#cbd5f5",
      text: "#111827",
    }
  );
};

export const getStateLabel = (value?: string | null): string => {
  const rawKey = normalizeStateKey(value);
  const key = STATE_ALIASES[rawKey] ?? rawKey;
  return STATE_LABELS[key] ?? (value ?? "").trim();
};
