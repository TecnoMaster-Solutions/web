export interface DocumentType {
  typeofdocumentid: number;
  name: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [];

export type TechnicianState = "Activo" | "Inactivo";

export interface Technician {
  id: number;
  name: string;
  lastName: string;

  documentType: string;

  documentNumber: string;
  phone: string;
  email: string;
  image?: string;
  state?: TechnicianState;
  types: string[];
  resumeUrl?: string;
}

export interface CreateTechnicianData {
  name: string;
  lastName: string;

  documentType: string;

  typeid: number;

  documentNumber: string;
  phone: string;
  email: string;

  image?: File;
  state?: TechnicianState;
  types: string[];

  resumePdf: File;
}

export interface EditTechnicianData {
  id: number;
  name: string;
  lastName: string;

  documentType: string;
  typeid: number;

  documentNumber: string;
  phone: string;
  email: string;

  image?: File;
  state?: TechnicianState;
  types: string[];

  resumePdf?: File;
}

export type TechnicianErrors = {
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
};
