export interface ISupplier {
  name: any;
  supplierid: number;
  contactname: string;
  servicetype: string;
  nit: string;
  address: string;
  rating: number;
}

export interface IState {
  stateid: number;
  name: string;
}
export interface IPurchase {
  purchaseorderid: number;
  numberoforder: string;
  reference: string;
  supplierid: number;
  stateid: number;
  createdat: string;
  updatedat: string;
  amount: number | string;

  supplier?: {
    supplierid: number;
    name: string;
    nit: string;
    contactname: string;
  };

  state?: {
    stateid: number;
    name: string;
  };

  purchaseProducts?: {
    purchaseProductId: number;
    productid: number;
    quantity: number;
    unitprice: string;
    subtotal: string;
    product?: {
      productid: number;
      productname: string;
      productpriceofsupplier: number;
      productpriceofsale: number;
      description?: string;
      image?: string;
    };
  }[];
}
