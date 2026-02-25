import { showWarning } from "@/shared/utils/notifications";

const CLOUD_NAME = "ditjhxzre";
const UPLOAD_PRESET = "Vertecx";

export const uploadFile = async (file: File): Promise<string | null> => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      { method: "POST", body: data }
    );

    const json = await res.json();

    if (!res.ok) throw new Error(json.error?.message);

    return json.secure_url;
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    showWarning("Error al subir archivo a Cloudinary.");
    return null;
  }
};
