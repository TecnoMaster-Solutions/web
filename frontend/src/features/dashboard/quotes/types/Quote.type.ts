export type QuoteTableRow = {
  id: number;
  requestRef: string;
  client: string;
  technician: string;
  serviceType: string;
  itemsSummary: string;
  status: string;
  statusSearch?: string;
  creationDate: string;
  amount: number;
  detailsCount?: number;
  raw: unknown; // quote completo para ver detalle
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
  ordersservices?: unknown;
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
  serviceRequestId?: number;
  customerid?: number;
  technicianid?: number;
  statesid: number;
  servicetype: string;
  observation: string;
  details: Array<{
    productid: number | null;
    description: string;
    quantity: number;
    unitprice: number;
    subtotal: number;
    availability: "DISPONIBLE" | "NO_DISPONIBLE" | "SOLICITAR";
  }>;
};
