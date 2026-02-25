import { Technician, CreateTechnicianData } from "@/features/dashboard/technicians/types/typesTechnicians";

export interface TechnicianErrors {
  name?: string;
  lastName?: string;
  documentType?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  image?: string;
  state?: string;
  types?: string;
  resumePdf?: string;
}

const normEmail = (v: string) => String(v || "").trim().toLowerCase();
const onlyDigits = (v: string) => String(v || "").replace(/\D/g, "");
const normDoc = (v: string) => String(v || "").trim().toLowerCase();

export const validateTechnicianField = (
  field: keyof Omit<CreateTechnicianData, "image" | "state">,
  value: any,
  technicians: Technician[],
  extra?: { documentType?: string; id?: number; excludeId?: number }
): string | undefined => {
  const currentId = extra?.excludeId ?? extra?.id;

  switch (field) {
    case "name":
      if (!String(value).trim()) return "El nombre es obligatorio";
      return;

    case "lastName":
      if (!String(value).trim()) return "El apellido es obligatorio";
      return;

    case "documentType":
      if (!String(value)) return "El tipo de documento es obligatorio";
      return;

    case "documentNumber": {
      if (!value || String(value).trim() === "")
        return "El número de documento es obligatorio";

      const docValRaw = String(value).trim();
      const tipo = extra?.documentType;

      if (tipo === "CC") {
        if (!/^\d{7,10}$/.test(docValRaw))
          return "La cédula debe tener entre 7 y 10 dígitos";
      } 
      else if (tipo === "PPT") {
        if (!/^\d{7}$/.test(docValRaw))
          return "El PPT debe tener exactamente 7 dígitos numéricos";
      } 
      else if (tipo === "PA") {
        if (!/^[A-Za-z]{2}\d{6}$/.test(docValRaw))
          return "El pasaporte debe tener 2 letras seguidas de 6 números (Ejemplo: AB123456)";
      } 
      else if (tipo === "CE") {
        if (!/^\d{9}$/.test(docValRaw))
          return "La Cédula de Extranjería debe tener exactamente 9 dígitos";
      } 
      else if (tipo === "VI") {
        if (!/^\d{12}$/.test(docValRaw))
          return "El número de Visa (VI) debe tener exactamente 12 dígitos numéricos";
      }

      const docKey = normDoc(docValRaw);
      if (
        technicians.some(
          (t) =>
            normDoc(t.documentNumber) === docKey &&
            t.id !== currentId
        )
      ) {
        return "Ya existe un técnico con este número de documento";
      }
      return;
    }

    case "phone": {
      if (!String(value).trim()) return "El teléfono es obligatorio";
      const phoneDigits = onlyDigits(String(value));
      if (!/^\d{10}$/.test(phoneDigits))
        return "El teléfono debe tener exactamente 10 dígitos";

      if (
        technicians.some(
          (t) => onlyDigits(t.phone) === phoneDigits && t.id !== currentId
        )
      ) {
        return "Ya existe un técnico con este teléfono";
      }
      return;
    }

    case "email": {
      if (!String(value).trim()) return "El correo electrónico es obligatorio";
      const emailNorm = normEmail(value);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm))
        return "El correo no es válido";

      if (
        technicians.some(
          (t) => normEmail(t.email) === emailNorm && t.id !== currentId
        )
      )
        return "Ya existe un técnico con este correo";
      return;
    }

    case "types": {
      const arr = Array.isArray(value) ? value : [];
      if (!arr.length) return "Seleccione al menos un tipo de técnico";
      return;
    }

    case "resumePdf": {
      const file = value as File | undefined;
      if (!file) return "La hoja de vida (PDF) es obligatoria";
      if (file.type !== "application/pdf") return "El archivo debe ser un PDF";
      const max = 10 * 1024 * 1024;
      if (file.size > max) return "El PDF no debe superar 10MB";
      return;
    }

    default:
      return;
  }
};

type ValidateFormOpts = {
  excludeId?: number;
  requirePdf?: boolean;        
  hasExistingResume?: boolean;
};

export const validateTechnicianForm = (
  data: Partial<CreateTechnicianData> & { id?: number },
  technicians: Technician[],
  opts?: ValidateFormOpts
): TechnicianErrors => {
  const errors: TechnicianErrors = {};
  const baseFields: (keyof TechnicianErrors)[] = [
    "name",
    "lastName",
    "documentType",
    "documentNumber",
    "phone",
    "email",
    "types",
  ];

  const includeResume =
    typeof opts?.requirePdf === "boolean"
      ? opts.requirePdf
      : !opts?.hasExistingResume;

  const fields: (keyof TechnicianErrors)[] = includeResume
    ? [...baseFields, "resumePdf"]
    : baseFields;

  fields.forEach((field) => {
    const error = validateTechnicianField(
      field as keyof Omit<CreateTechnicianData, "image" | "state">,
      (data as any)[field],
      technicians,
      {
        documentType: data.documentType,
        id: data.id,
        excludeId: opts?.excludeId,
      }
    );
    if (error) errors[field] = error;
  });

  return errors;
};
