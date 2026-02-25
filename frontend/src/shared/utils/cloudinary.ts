  export const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dn4snnwkt/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) throw new Error("Error subiendo la imagen a Cloudinary");
    const data = await res.json();
    return data.secure_url as string;
  };

  export const uploadPdfToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "vertecx_pdf_public");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dn4snnwkt/raw/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) throw new Error("Error subiendo el PDF a Cloudinary");
    const data = await res.json();
    return data.secure_url;
  };

