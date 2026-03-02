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

export interface ICustomer {
    customerid: number;
    userid: number;
    customercity: string | null;
    customerzipcode: string | null;
    users?: {
        userid: number;
        name: string;
        lastname: string;
        documentnumber?: string | null;
        phone?: string | null;
        email: string;
        image?: string | null;
    };
}

export interface ISaleDetail {
    saledetailid: number;
    saleid: number;
    productid: number | null;
    serviceid?: number | null;
    quantity: number;
    unitprice: number;
    linetotal: number;
    discountpercent: number;
    discountamount: number;
    notes: string | null;
    products?: IProduct;
    service?: IService;
}

export interface ISalesPayment {
    paymentid: number;
    saleid: number;
    amount: number;
    paymentmethod: string | null;
    reference: string | null;
    invoiceurl: string | null;
    createdat: string;
}

export type SalePaymentRequestType = "HALF" | "FULL" | "REMAINING";
export type SalePaymentRequestStatus =
    | "PendingReceipt"
    | "ReceiptUploaded"
    | "Approved"
    | "Rejected"
    | "Cancelled";

export interface IUserActorSummary {
    userid: number;
    name: string;
    lastname?: string | null;
    email?: string | null;
}

export interface ISalePaymentRequest {
    paymentRequestId: number;
    saleid: number;
    requestType: SalePaymentRequestType;
    expectedAmount: number;
    status: SalePaymentRequestStatus;
    receiptUrl: string | null;
    receiptReference: string | null;
    receiptNotes: string | null;
    adminNotes: string | null;
    reviewNotes: string | null;
    requestedByUserId: number | null;
    receiptUploadedByUserId: number | null;
    reviewedByUserId: number | null;
    approvedPaymentId: number | null;
    receiptUploadedAt: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
    approvedPayment?: ISalesPayment | null;
    requestedByUser?: IUserActorSummary | null;
    receiptUploadedByUser?: IUserActorSummary | null;
    reviewedByUser?: IUserActorSummary | null;
}

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
    paymentstatus: "Pending" | "Abonada" | "Pagada";
    paidamount: number;
    pendingamount?: number;
    createdby: string | null;
    createddate: string | null;
    updateddate?: string | null;
    notes: string | null;
    paymentInvoiceUrl?: string | null;
    customer?: ICustomer;
    salesdetail?: ISaleDetail[];
    payments?: ISalesPayment[];
    paymentRequests?: ISalePaymentRequest[];
}

export interface ICreateSaleDetailDto {
    productid?: number;
    serviceid?: number;
    quantity: number;
    unitprice: number;
    discountpercent?: number;
    notes?: string;
}

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
    paymentInvoiceUrl?: string;
    details: ICreateSaleDetailDto[];
}

export interface ICreateSalePaymentDto {
    amount: number;
    paymentmethod?: string;
    reference?: string;
    file?: File | null;
}

export interface ICreateSalePaymentRequestDto {
    requestType: SalePaymentRequestType;
    expectedAmount: number;
    adminNotes?: string;
}

export interface IReviewSalePaymentRequestDto {
    reviewNotes?: string;
    paymentmethod?: string;
    reference?: string;
}

export interface IUploadSalePaymentReceiptDto {
    receiptReference?: string;
    receiptNotes?: string;
    file: File | null;
}

export interface ICartItem {
    id: string;
    type: "Producto" | "Servicio";
    productid?: number;
    serviceid?: number;
    name: string;
    category: string;
    image: string | null;
    quantity: number;
    unitprice: number;
    stock: number;
    linetotal: number;
    discountpercent: number;
}

export interface IAnnulSaleData {
    saleid: number;
    salecode: string;
    cliente: string;
    fecha: string;
}
