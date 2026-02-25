export type SupplierState = {
  stateid: number;
  name: "Activo" | "Inactivo";
};

export type SupplierDTO = {
  supplierid: number;
  stateid: number;
  name: string;
  nit: string;
  phone: string;
  email: string;
  address?: string | null;
  contactname: string;
  rating?: number | null;
  image?: string | null;
  state?: SupplierState | null;
  createat?: string;
  updateat?: string;
};
