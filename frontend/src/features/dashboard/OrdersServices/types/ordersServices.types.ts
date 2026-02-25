export type OrdersServiceHistoryType = "SYSTEM" | "TECH";

export type UserLite = {
  userid: number;
  name?: string | null;
  lastname?: string | null;
  email?: string | null;
};

export type CustomerDTO = {
  customerid: number;
  users?: UserLite | null;
};

export type TechnicianDTO = {
  technicianid: number;
  users?: UserLite | null;
};

export type ProductDTO = {
  productid: number;
  productname: string;
  productpriceofsale?: number | null;
};

export type ServiceDTO = {
  serviceid: number;
  name: string;
  servicepriceofsale?: number | null;
  typeofservice?: {
    typeofserviceid?: number | null;
    typeofservicename?: string | null;
  } | null;
};

export type OrderProductLineDTO = {
  ordersservicesproductsid: number;
  cantidad: number;
  subtotal: number;
  product: ProductDTO;
};

export type OrderServiceLineDTO = {
  ordersservicesservicesid: number;
  cantidad: number;
  unitprice: number;
  subtotal: number;
  service: ServiceDTO;
};

export type OrdersServiceHistoryItem = {
  ordersserviceshistoryid: number;
  type: OrdersServiceHistoryType;
  message: string;
  createdat: string;
  actoruserid?: number | null;
  technician?: TechnicianDTO | null;
  progresspercent?: number | null;
  attachments?: string[] | null;
};

export type OrdersServiceWarrantyDTO =
  | {
      label: string;
      details: string;
      notifiedClient: boolean;
      reportedBy: string | null;
      reportedByUserId: number | null;
      reportedAtISO: string | null;
    }
  | null;

export type OrderServiceDTO = {
  ordersservicesid: number;
  description: string;
  direccion?: string | null;
  client?: CustomerDTO | null;
  state?: { stateid: number; name: string } | null;
  fechainicio?: string | null;
  fechafin?: string | null;
  horainicio?: string | null;
  horafin?: string | null;
  technicians?: TechnicianDTO[];
  products?: OrderProductLineDTO[];
  services?: OrderServiceLineDTO[];
  files?: string[];
  viaticos?: number;
  total?: number;
  history?: OrdersServiceHistoryItem[];
  warranty?: OrdersServiceWarrantyDTO;
};

export type CreateOrderProductDto = {
  productid: number;
  cantidad: number;
};

export type CreateOrderServiceLineDto = {
  serviceid: number;
  cantidad: number;
  unitprice?: number;
  precio?: number;
};

export type CreateOrdersServiceDto = {
  description: string;
  direccion: string;
  clientid: number;
  stateid: number;
  fechainicio: string;
  fechafin: string;
  horainicio: string;
  horafin: string;
  technicians: number[];
  products: CreateOrderProductDto[];
  services: CreateOrderServiceLineDto[];
  files?: string[];
  viaticos: number;
};

export type UpdateOrdersServiceDto = {
  description?: string;
  direccion?: string;
  clientid?: number;
  stateid?: number;
  fechainicio?: string;
  fechafin?: string;
  horainicio?: string;
  horafin?: string;
  technicians?: number[];
  files?: string[];
  viaticos?: number;
};

export type AddProductToOrderDto = {
  productid: number;
  cantidad: number;
};

export type UpdateProductLineDto = {
  cantidad: number;
};

export type AddServiceToOrderDto = {
  serviceid: number;
  cantidad: number;
  unitprice?: number;
};

export type UpdateServiceLineDto = {
  cantidad: number;
  unitprice?: number;
};

export type AssignTechniciansDto = {
  technicians: number[];
};

export type ReprogramOrderDto = {
  fechainicio: string;
  fechafin: string;
  horainicio: string;
  horafin: string;
  reason?: string;
};

export type FinishOrderDto = {
  fechafin: string;
  horafin: string;
  stateid?: number;
};

export type AddOrderFileDto = {
  url: string;
};

export type RemoveFileDto = {
  url: string;
};

export type AddWorklogDto = {
  technicianid: number;
  note: string;
  title?: string;
  progresspercent?: number;
  attachments?: string[];
};

export type ReportWarrantyDto = {
  label?: string;
  details: string;
  notifiedClient?: boolean;
  reportedByUserId?: number;
};
