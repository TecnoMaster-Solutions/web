export type MercadoPagoCheckoutItem = {
  id?: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unitMeasure?: string;
  pictureUrl?: string;
};

export type MercadoPagoCheckoutBackUrls = {
  success: string;
  failure: string;
  pending: string;
};

export type MercadoPagoCheckoutPayer = {
  name?: string;
  surname?: string;
  email?: string;
};

export type MercadoPagoCheckoutPreferencePayload = {
  items: MercadoPagoCheckoutItem[];
  backUrls: MercadoPagoCheckoutBackUrls;
  notificationUrl: string;
  externalReference: string;
  payer?: MercadoPagoCheckoutPayer;
  metadata?: Record<string, unknown>;
  autoReturnApproved?: boolean;
};

export type MercadoPagoCheckoutPreferenceResponse = {
  id: string;
  initPoint?: string;
  sandboxInitPoint?: string;
};

export type MercadoPagoSaleCheckoutItem = {
  id: string;
  title: string;
  unitPrice: number;
  quantity: number;
};

export type MercadoPagoSaleCheckoutRequest = {
  items: MercadoPagoSaleCheckoutItem[];
  customerId: number;
  payer?: MercadoPagoCheckoutPayer;
  metadata?: Record<string, unknown>;
};

export type MercadoPagoSaleCheckoutResponse = {
  saleId: number;
  externalReference: string;
  initPoint?: string;
  sandboxInitPoint?: string;
};

export type SalePaymentStatusResponse = {
  saleId: number;
  status: "PENDING" | "PAID" | "REJECTED" | "CANCELLED";
  totalAmount: number;
  currency: string;
  mpPreferenceId?: string | null;
  mpPaymentId?: string | null;
  externalReference?: string | null;
  rawSaleStatus?: string | null;
  mpPaymentStatus?: string | null;
};

export type MercadoPagoPaymentConfirmation = {
  id?: string | number;
  status?: string;
  external_reference?: string;
  saleId?: number | null;
  [key: string]: unknown;
};
