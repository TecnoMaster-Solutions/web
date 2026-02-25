const normalizeMonthLabel = (value?: string) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const MONTH_LABEL_TO_NUMBER: Record<string, number> = {
  // Inglés
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,

  // Español
  ene: 1,
  enero: 1,
  febr: 2,
  febrero: 2,
  marz: 3,
  marzo: 3,
  abr: 4,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  ago: 8,
  agosto: 8,
  septi: 9,
  septiembre: 9,
  oct: 10,
  octubre: 10,
  novi: 11,
  noviembre: 11,
  dici: 12,
  diciembre: 12,
};

export const getMonthNumberFromLabel = (value?: string | number | null) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const numeric = Math.floor(value);
    if (numeric >= 1 && numeric <= 12) return numeric;
  }

  if (typeof value !== "string") return 0;

  const normalized = normalizeMonthLabel(value);
  if (!normalized) return 0;

  if (/^\d+$/.test(normalized)) {
    const numeric = Number(normalized);
    if (numeric >= 1 && numeric <= 12) return numeric;
  }

  return MONTH_LABEL_TO_NUMBER[normalized] ?? 0;
};

export const MONTH_LABELS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const getMonthLabelFromNumber = (value?: number | null) => {
  if (!value || value < 1 || value > 12) return "";
  return MONTH_LABELS_ES[value - 1] ?? "";
};

export type MonthSelection = {
  label: string;
  value: number;
};
