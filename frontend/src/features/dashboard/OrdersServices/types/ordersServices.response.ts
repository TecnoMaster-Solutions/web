export type OS_State = {
  stateid: number;
  name: string;
  description: string | null;
};

export type OS_User = {
  userid: number;
  name: string;
  lastname: string;
  documentnumber: string;
  phone: string;
  email: string;
  password: string;
  mustchangepassword: boolean;
  image: string | null;
  createat: string;
  updateat: string;
  typeid: number;
  stateid: number;
  roleid: number;
};

export type OS_Client = {
  customerid: number;
  userid: number;
  customercity: string | null;
  customerzipcode: string | null;
  users: OS_User;
};

export type OS_Product = {
  productid: number;
  createddate: string;
  updatedat: string;
  categoryid: number;
  isactive: boolean;
  productpriceofsale: number;
  productpriceofsupplier: number;
  productstock: number;
  productname: string;
  productdescription: string | null;
  productcode: string | null;
  purchaseorderid: number | null;
  suppliercategory: string | null;
  image: string | null;
};

export type OS_OrderProduct = {
  ordersservicesproductsid: number;
  cantidad: number;
  subtotal: number;
  product: OS_Product;
};

export type OS_Technician = {
  technicianid: number;
  userid: number;
  CV: string | null;
  users: OS_User;
};

export type OS_History = {
  ordersserviceshistoryid: number;
  action: string;
  actionlabel: string;
  description: string | null;
  payload: Record<string, any>;
  actoruserid: number | null;
  createdat: string;
};

export type OrderServiceDTO = {
  ordersservicesid: number;
  description: string;
  direccion?: string | null;
  total: number;
  files: string[];
  fechainicio: string;
  fechafin: string;
  horainicio: string;
  horafin: string;
  createdat: string;
  updatedat: string;
  products: OS_OrderProduct[];
  technicians: OS_Technician[];
  client: OS_Client;
  state: OS_State;
  history: OS_History[];
};
