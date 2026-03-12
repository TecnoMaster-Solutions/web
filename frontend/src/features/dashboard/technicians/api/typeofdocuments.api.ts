import { getPublicRuntimeConfig } from "@/lib/runtime-config";

const API_URL = () => `${getPublicRuntimeConfig().apiUrl}/typeofdocuments`;

export interface DocumentTypeResponse {
  typeofdocumentid: number;
  name: string;
  stateid: number;
}

export const getDocumentTypes = async (): Promise<DocumentTypeResponse[]> => {
  const response = await fetch(API_URL());

  if (!response.ok) {
    throw new Error("Error al obtener los tipos de documento");
  }

  const result = await response.json();

  return result.data || [];
};
