export interface IState {
  stateid: number;
  name: string;
}

export interface IPurchaseOrderDetail {
  id?: number;
  ordenCompraId?: number;
  productoId: number | null;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  producto?: {
    productid: number;
    productname: string;
    image?: string;
    productpriceofsupplier?: number;
    productpriceofsale?: number;
  };
}

export interface IPurchaseOrder {
  id: number;
  numeroOrden: string;
  proveedorId: number;
  estadoId: number;

  fecha?: string;
  fechaCreacion?: string;
  fechaEstimadaEntrega?: string;

  detalles?: IPurchaseOrderDetail[];
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

  observation?: string;

  purchaseOrderId?: number | null;
  purchaseOrder?: IPurchaseOrder | null;

  purchaseOrderFinalStateId?: number;

  supplier?: {
    supplierid: number;
    name: string;
    nit: string;
    contactname: string;
    phone?: string;
    email?: string;
    address?: string;
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
      productdescription?: string;
      image?: string;
      productcode?: string;
      productstock?: number;
    };
  }[];
}