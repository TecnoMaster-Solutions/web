export interface Service {
  id: number;
  name: string;
  description?: string;
  image: string | File | null;

  category: string;
  state: "Activo" | "Inactivo";

  typeofserviceid: number;
  stateid: number;
}

export type CreateServicePayload = {
  name: string;
  description?: string;
  image: string | File | null;
  typeofserviceid: number;
};

export type EditServicePayload = CreateServicePayload & {
  id: number;
  stateid: number;
};
