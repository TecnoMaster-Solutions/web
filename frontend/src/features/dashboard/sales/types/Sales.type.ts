// ─────────────────────────────────────────────────────
// Tipos / Interfaces de Ventas
// Alineados con las entidades y DTOs del backend
// ─────────────────────────────────────────────────────

// ── Producto (para el buscador de productos) ──
export interface IProduct {
    productid: number;
    productname: string;
    productdescription: string | null;
    productcode: string | null;
    productpriceofsale: number | null;
    productpriceofsupplier: number;
    productstock: number;
    categoryid: number;
    isactive: boolean;
    image: string;
    category?: {
        id: number;
        name: string;
    };
}

// ── Servicio ──
export interface IService {
    serviceid: number;
    name: string;
    description: string | null;
    image: string;
    typeofserviceid: number;
    typeofservicename?: string;
    stateid: number;
    statename?: string;
}

// ── Cliente (para el selector de cliente) ──
export interface ICustomer {
    customerid: number;
    userid: number;
    customercity: string | null;
    customerzipcode: string | null;
    users?: {
        userid: number;
        name: string;
        lastname: string;
        email: string;
    };
}

// ── Detalle de venta (línea individual) ──
export interface ISaleDetail {
    saledetailid: number;
    saleid: number;
    productid: number;
    quantity: number;
    unitprice: number;
    linetotal: number;
    discountpercent: number;
    discountamount: number;
    notes: string | null;
    products?: IProduct;
}

// ── Venta completa (respuesta del backend) ──
export interface ISale {
    saleid: number;
    salecode: string;
    saledate: string;
    customerid: number;
    subtotal: number;
    taxamount: number;
    discountamount: number;
    totalamount: number;
    paymentmethod: string;
    salestatus: string;
    estadoPago: string | null;
    createdby: string | null;
    createddate: string | null;
    notes: string | null;
    customer?: ICustomer;
    salesdetail?: ISaleDetail[];
}

// ── DTO para crear detalle (envío al backend) ──
export interface ICreateSaleDetailDto {
    productid: number;
    quantity: number;
    unitprice: number;
    discountpercent?: number;
    notes?: string;
}

// ── DTO para crear venta (envío al backend) ──
export interface ICreateSaleDto {
    salecode: string;
    saledate: string;
    customerid: number;
    subtotal: number;
    totalamount: number;
    taxamount?: number;
    taxpercent?: number;
    discountamount?: number;
    paymentmethod?: string;
    salestatus?: string;
    createdby?: string;
    notes?: string;
    details: ICreateSaleDetailDto[];
}

// ── Ítem del carrito (uso interno del frontend) ──
export interface ICartItem {
    id: string; // unique key para React
    type: "Producto" | "Servicio";
    productid?: number;
    serviceid?: number;
    name: string;
    category: string;
    image: string | null;
    quantity: number;
    unitprice: number;
    stock: number; // 0 para servicios
    linetotal: number;
    discountpercent: number;
}

// ── Anulación ──
export interface IAnnulSaleData {
    saleid: number;
    salecode: string;
    cliente: string;
    fecha: string;
}