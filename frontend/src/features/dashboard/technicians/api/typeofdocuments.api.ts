const API_URL = `${
  process.env.NEXT_PUBLIC_API_URL ||
  "https://vertecx-api-sha-09ac69f.onrender.com"
}/typeofdocuments`;

export interface DocumentTypeResponse {
  typeofdocumentid: number;
  name: string;
  stateid: number;
}

export const getDocumentTypes = async (): Promise<DocumentTypeResponse[]> => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Error al obtener los tipos de documento");
  }

  const result = await response.json();

  return result.data || [];
};
