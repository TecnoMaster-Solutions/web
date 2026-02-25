export type SupplierSubmitPayload = {
  name: string;
  nit: string;
  phone: string;
  email: string;
  address: string;
  contactName: string;
  status: "Activo" | "Inactivo";
  rating: number;
  imageFile: File | null;
  imageUrl: string | null;
};
