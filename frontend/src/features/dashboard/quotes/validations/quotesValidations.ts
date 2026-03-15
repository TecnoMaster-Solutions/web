export interface QuoteErrors {
  serviceTypes?: string;
  client?: string;
  status?: string;
  description?: string;
  materials?: string;
  total?: string;
}

export type QuoteFormData = {
  serviceTypes: {
    mantenimiento: boolean;
    instalacion: boolean;
  };
  client: string;
  status: string;
  description: string;
  materials: Array<{ name: string; subtotal: number }>;
  total: number | string;
};

export const validateQuoteField = (
  field: keyof QuoteFormData,
  value: QuoteFormData[keyof QuoteFormData],
): string | undefined => {
  switch (field) {
    case "client":
      return String(value ?? "").trim() ? undefined : "El cliente es obligatorio";

    case "status":
      if (!value) return "El estado es obligatorio";
      if (!["Pendiente", "Aprobada", "Rechazada", "Anulada"].includes(String(value))) {
        return "Estado invalido";
      }
      return undefined;

    case "description":
      return String(value ?? "").trim().length >= 5
        ? undefined
        : "La descripcion debe tener al menos 5 caracteres";

    case "materials":
      return Array.isArray(value) && value.length > 0
        ? undefined
        : "Debes añadir al menos un material";

    case "total": {
      const numericTotal = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
      if (Number.isNaN(numericTotal) || numericTotal <= 0) {
        return "El total debe ser mayor que 0";
      }
      return undefined;
    }

    case "serviceTypes": {
      const serviceTypes = value as QuoteFormData["serviceTypes"];
      return serviceTypes?.mantenimiento || serviceTypes?.instalacion
        ? undefined
        : "Selecciona al menos un tipo de servicio";
    }

    default:
      return undefined;
  }
};

export const validateQuoteForm = (data: QuoteFormData): QuoteErrors => {
  const errors: QuoteErrors = {};
  const fields: Array<keyof QuoteFormData> = [
    "serviceTypes",
    "client",
    "status",
    "description",
    "materials",
    "total",
  ];

  fields.forEach((field) => {
    const error = validateQuoteField(field, data[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};
