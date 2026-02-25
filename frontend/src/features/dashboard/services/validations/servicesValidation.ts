import { Service } from "@/features/dashboard/services/types/typesServices";

export interface ServiceErrors {
  name?: string;
  description?: string;
  category?: string;
  image?: string;
}

export const validateServiceField = (
  field: keyof Omit<Service, "id" | "state">,
  value: Service[keyof Omit<Service, "id" | "state">],
  services: Service[],
  currentId?: number
): string | undefined => {
  switch (field) {
    case "name": {
      const v = String(value ?? "").trim();
      if (!v) return "El nombre es obligatorio";

      const exists = services.some(
        (s) => s.name.toLowerCase() === v.toLowerCase() && s.id !== currentId
      );
      if (exists) return "Ya existe un servicio con este nombre";
      return;
    }

    case "category":
      if (!value) return "La categoría es obligatoria";
      return;

    case "image":
      if (!value) return "Debe seleccionar una imagen";
      if (typeof value === "string" && !value.trim()) return "Debe seleccionar una imagen";
      return;

    case "description":
      return;

    default:
      return;
  }
};

export const validateServiceForm = (
  data: Omit<Service, "id" | "state">,
  services: Service[],
  currentId?: number
): ServiceErrors => {
  const errors: ServiceErrors = {};

  const fields: (keyof Omit<Service, "id" | "state">)[] = [
    "name",
    "description",
    "category",
    "image",
  ];

  fields.forEach((field) => {
    const value = data[field];
    const error = validateServiceField(field, value, services, currentId);
    if (error) (errors as any)[field] = error;
  });

  return errors;
};
