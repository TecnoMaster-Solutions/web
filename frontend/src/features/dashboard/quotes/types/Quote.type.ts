export type QuoteTableRow = {
  id: number;
  client: string;
  technician: string;
  status: string;
  creationDate: string;
  amount: number;
  raw: any; // quote completo para ver detalle
};

export interface QuoteDetail {
  quotedetailid?: number;
  quotesid?: number;
  productid?: number | null;
  description: string;
  quantity: number;
  unitprice: number;
  subtotal: number;
  availability?: string;
}

export interface ServiceRequest {
  serviceRequestId: number;
  scheduledAt?: string;
  scheduledEndAt?: string;
  serviceType?: string;
  direccion?: string;
  description?: string;
  createdAt?: string;
  stateId?: number;
  serviceId?: number;
  clientId?: number;
}

export interface IQuote {
  quotesid: number;
  observation?: string | null;
  servicetype?: string | null;
  subtotal?: number;
  tax?: number;
  total?: number;
  state?: {
    name?: string;
    description?: string | null;
    stateid?: number;
  };
  serviceRequest?: ServiceRequest;
  ordersservices?: any;
  customer?: {
    customerid?: number;
    userid?: number;
    customercity?: string;
    customerzipcode?: string;
    users?: {
      userid?: number;
      name?: string;
      lastname?: string;
      email?: string;
      phone?: string;
    };
  };
  technician?: {
    technicianid?: number;
    userid?: number;
    CV?: string;
    users?: {
      userid?: number;
      name?: string;
      lastname?: string;
      email?: string;
      phone?: string;
    };
  };
  details?: QuoteDetail[];
}

export type QuoteDetailPayload = {
  productid: number | null;
  name: string;
  description: string;
  quantity: number;
  unitprice: number;
  subtotal: number;
  availability: "DISPONIBLE" | "NO_DISPONIBLE" | "SOLICITAR";
  isBackorder?: boolean;
};

export type QuoteCreatePayload = {
  serviceRequestId: number;
  statesid: number;
  customerid: number;
  technicianid: number;
  servicetype: string;
  observation: string;
  subtotal: number;
  tax: number;
  total: number;
  details: QuoteDetailPayload[];
};
