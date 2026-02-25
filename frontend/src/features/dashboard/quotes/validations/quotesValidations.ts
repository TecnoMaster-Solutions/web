import { IQuote } from "@/features/dashboard/quotes/types/Quote.type";

export interface QuoteErrors {
  serviceTypes?: string;
  client?: string;
  status?: string;
  description?: string;
  materials?: string;
  total?: string;
}

/**
 * ✅ Valida un campo individual del formulario de cotización
 */
export const validateQuoteField = (
  field: keyof Omit<IQuote, "id">,
  value: any,
  quotes: IQuote[],
  currentId?: number
): string | undefined => {
  switch (field) {
    case "client":
      if (!value) return "El cliente es obligatorio";
      return;

    case "status":
      if (!value) return "El estado es obligatorio";
      if (!["Pendiente", "Aprobada", "Rechazada", "Anulada"].includes(value))
        return "Estado inválido";
      return;

    case "description":
      if (value && value.trim().length < 5)
        return "La descripción debe tener al menos 5 caracteres";
      return;

    case "materials":
      if (!value || (Array.isArray(value) && value.length === 0))
        return "Debes añadir al menos un material";
      return;

    case "total":
      if (value === undefined || value === null || value === "")
        return "El total es obligatorio";
      const numericTotal = Number(String(value).replace(/[^\d.-]/g, ""));
      if (isNaN(numericTotal) || numericTotal <= 0)
        return "El total debe ser mayor que 0";
      return;

    case "serviceTypes":
      if (!value || (!value.mantenimiento && !value.instalacion))
        return "Selecciona al menos un tipo de servicio";
      return;

    default:
      return;
  }
};

/**
 * ✅ Valida todo el formulario de cotización
 */
export const validateQuoteForm = (
  data: Omit<IQuote, "id">,
  quotes: IQuote[],
  currentId?: number
): QuoteErrors => {
  const errors: QuoteErrors = {};

  const fields: (keyof Omit<IQuote, "id">)[] = [
    "serviceTypes",
    "client",
    "status",
    "description",
    "materials",
    "total",
  ];

  fields.forEach((field) => {
    const error = validateQuoteField(
      field,
      (data as any)[field],
      quotes,
      currentId
    );
    if (error) errors[field] = error;
  });

  return errors;
};
