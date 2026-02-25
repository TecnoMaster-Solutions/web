/* eslint-disable @typescript-eslint/no-explicit-any */
export type QuoteLike = any;

export type QuoteNormalized = {
  saleid?: number;
  servicerequestid?: number;
  serviceRequestId?: number;
  serviceid?: number;
  quotesid?: number;
  clientid?: number;
  technicianid?: number;
  typeofserviceid?: number | null;
  typeofservicename?: string | null;
  fechainicio?: string;
  fechafin?: string;
  horainicio?: string;
  horafin?: string;
  viaticos?: number;
  direccion?: string;
  technicians?: number[];
  description?: string;
  services?: Array<{ serviceid: number; cantidad: number; unitprice: number }>;
  products?: Array<{ productid: number; cantidad: number; unitprice?: number }>;
};

export const SCHEDULE_MIN = 7 * 60;
export const SCHEDULE_MAX = 17 * 60;

export function toNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeKey(v: any): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function unwrapList(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") {
    if (Array.isArray((x as any).data)) return (x as any).data;
    if (Array.isArray((x as any).items)) return (x as any).items;
    if (Array.isArray((x as any).results)) return (x as any).results;
    if (Array.isArray((x as any).rows)) return (x as any).rows;
  }
  return [];
}

export function dedupeById<T = any>(arr: T[], getId?: (x: any) => any): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr || []) {
    const rawId = getId ? getId(x) : (x as any)?.serviceid ?? (x as any)?.id ?? (x as any)?.productid;
    const key = rawId === undefined || rawId === null ? "" : String(rawId);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(x);
  }
  return out;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function formatCOP(n?: number) {
  return n == null
    ? "-"
    : n.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      });
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toLocalYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toLocalHM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function titleCase(s: string) {
  const x = String(s ?? "").trim();
  if (!x) return "";
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase() || "T";
}

export function normalizeText(v: string) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseYMD(ymd: string) {
  const [y, m, d] = (ymd || "").split("-").map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function timeToMinutes(hm: string) {
  const [h, m] = (hm || "").split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

export function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function isAllowedDate(ymd: string) {
  const d = parseYMD(ymd);
  if (!d) return false;
  const day = d.getDay();
  return day >= 1 && day <= 6;
}

export function isAllowedTime(hm: string) {
  const mins = timeToMinutes(hm);
  if (!Number.isFinite(mins)) return false;
  return mins >= SCHEDULE_MIN && mins <= SCHEDULE_MAX;
}

function asNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function pickNumber(...vals: any[]) {
  for (const v of vals) {
    const n = asNumber(v);
    if (n != null) return n;
  }
  return undefined;
}

function pickString(...vals: any[]) {
  for (const v of vals) {
    const s = typeof v === "string" ? v : v == null ? "" : String(v);
    const t = s.trim();
    if (t) return t;
  }
  return "";
}

function toNumArray(v: any): number[] {
  if (Array.isArray(v)) return v.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
  if (typeof v === "string") {
    return v
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  }
  return [];
}

function decodeBase64Url(input: string) {
  const base = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = base.length % 4 === 0 ? "" : "=".repeat(4 - (base.length % 4));
  return atob(base + pad);
}

export function parseQuoteParam(raw: string): any | null {
  const v = String(raw || "").trim();
  if (!v) return null;
  try {
    if (v.startsWith("{") || v.startsWith("[")) return JSON.parse(v);
  } catch {}
  try {
    const json = decodeBase64Url(v);
    return JSON.parse(json);
  } catch {}
  return null;
}

export function extractFreeTextFromDescription(desc: string) {
  const s = String(desc || "").trim();
  if (!s) return "";
  const hasStructured =
    /\bTipo:\s*/i.test(s) ||
    /\bServicios:\s*/i.test(s) ||
    /\bProductos:\s*/i.test(s) ||
    /\bDescripcion:\s*/i.test(s) ||
    /\bDescripci[oó]n:\s*/i.test(s);
  if (!hasStructured) return s;
  const m = s.match(/Descripci[oó]n:\s*([\s\S]*)$/i) || s.match(/Descripcion:\s*([\s\S]*)$/i);
  if (m && m[1]) return String(m[1]).trim();
  return "";
}

export function coerceAllowedDateOrNext(ymd: string) {
  if (isAllowedDate(ymd)) return ymd;
  const d = parseYMD(ymd);
  if (!d) return toLocalYMD(new Date());
  for (let i = 0; i < 10; i++) {
    d.setDate(d.getDate() + 1);
    const next = toLocalYMD(d);
    if (isAllowedDate(next)) return next;
  }
  return toLocalYMD(new Date());
}

export function coerceAllowedTime(hm: string, fallback: string) {
  if (isAllowedTime(hm)) return hm;
  return fallback;
}

export function normalizeQuote(q: QuoteLike): QuoteNormalized {
  const root = q?.sale ?? q?.sales ?? q?.quote ?? q?.quotation ?? q?.cotizacion ?? q;

  const saleid = pickNumber(root?.saleid, root?.salesid);
  const quotesid = pickNumber(root?.saleid, root?.salesid, root?.quotesid, root?.quotationid, root?.cotizacionid, root?.id);

  const servicerequestid = pickNumber(
    root?.servicerequestid,
    root?.serviceRequestId,
    root?.servicerequestId,
    root?.service_request_id
  );

  const serviceid = pickNumber(root?.serviceid, root?.serviceId, root?.service?.serviceid, root?.service?.id);
  const clientid = pickNumber(
    root?.customerid,
    root?.clientid,
    root?.client?.clientid,
    root?.customer?.customerid,
    root?.client?.id,
    root?.customer?.id
  );

  const technicianid = pickNumber(
    root?.technicianid,
    root?.technicianId,
    root?.technician?.technicianid,
    root?.technician?.id
  );

  const techs = toNumArray(root?.technicians ?? root?.technicianids ?? root?.techs ?? root?.assignedTechnicians);

  const fechainicio = pickString(root?.fechainicio, root?.dateStart, root?.startdate, root?.startDate, root?.saledate);
  const fechafin = pickString(root?.fechafin, root?.dateEnd, root?.enddate, root?.endDate, root?.saledate);
  const horainicio = pickString(root?.horainicio, root?.timeStart, root?.starttime, root?.startTime);
  const horafin = pickString(root?.horafin, root?.timeEnd, root?.endtime, root?.endTime);

  const viaticos = pickNumber(root?.viaticos, root?.travelExpenses, root?.travel, root?.transport) ?? 0;
  const direccion = pickString(
    root?.direccion,
    root?.address,
    root?.serviceaddress,
    root?.serviceAddress,
    root?.location,
    root?.ubicacion,
    root?.serviceRequest?.direccion,
    root?.serviceRequest?.address,
    root?.request?.direccion,
    root?.request?.address
  );

  const description = pickString(root?.description, root?.notes, root?.observations);

  const rawServices =
    root?.services ??
    root?.quotedservices ??
    root?.servicesitems ??
    root?.details?.services ??
    root?.detail?.services ??
    root?.quoteDetails?.services ??
    [];
  const servicesArr = Array.isArray(rawServices) ? rawServices : [];

  const rawDetails = Array.isArray(root?.details)
    ? root.details
    : Array.isArray(root?.quoteDetails)
      ? root.quoteDetails
      : [];

  const rawProducts =
    root?.products ??
    root?.materials ??
    root?.items ??
    root?.quotedproducts ??
    root?.productsitems ??
    root?.details?.products ??
    root?.quoteDetails?.products ??
    root?.salesdetail ??
    [];
  const productsArr = Array.isArray(rawProducts) ? rawProducts : [];

  const typeofserviceid =
    pickNumber(
      root?.typeofserviceid,
      root?.typeOfServiceId,
      root?.servicetypeid,
      root?.serviceTypeId,
      servicesArr?.[0]?.typeofserviceid,
      servicesArr?.[0]?.typeOfServiceId,
      servicesArr?.[0]?.service?.typeofserviceid,
      servicesArr?.[0]?.service?.typeOfServiceId
    ) ?? null;

  const typeofservicename =
    pickString(
      root?.typeofservicename,
      root?.servicetype,
      root?.serviceType,
      root?.typeName,
      root?.type,
      root?.service?.typeofservicename,
      root?.service?.typeName,
      servicesArr?.[0]?.typeofservicename,
      servicesArr?.[0]?.service?.typeofservicename,
      servicesArr?.[0]?.service?.typeName
    ) || null;

  const mergedProducts = [...productsArr, ...rawDetails];

  const services = servicesArr
    .map((s: any) => {
      const serviceid = pickNumber(s?.serviceid, s?.id, s?.service?.serviceid, s?.service?.id);
      const cantidad = pickNumber(s?.cantidad, s?.quantity, s?.qty) ?? 1;
      const unitprice = pickNumber(s?.unitprice, s?.price, s?.unitPrice, s?.valor) ?? 0;
      if (!serviceid) return null;
      return {
        serviceid,
        cantidad: Math.max(1, Math.round(cantidad)),
        unitprice: Math.max(0, Math.round(unitprice)),
      };
    })
    .filter(Boolean) as Array<{ serviceid: number; cantidad: number; unitprice: number }>;

  const products = mergedProducts
    .map((p: any) => {
      const productid = pickNumber(
        p?.productid,
        p?.id,
        p?.product?.productid,
        p?.product?.id,
        p?.products?.productid,
        p?.products?.id
      );
      const cantidad = pickNumber(p?.cantidad, p?.quantity, p?.qty) ?? 1;
      const unitprice = pickNumber(p?.unitprice, p?.price, p?.unitPrice, p?.valor, p?.subtotal);
      if (!productid) return null;
      return {
        productid,
        cantidad: Math.max(1, Math.round(cantidad)),
        unitprice: unitprice == null ? undefined : Math.max(0, Math.round(unitprice)),
      };
    })
    .filter(Boolean) as Array<{ productid: number; cantidad: number; unitprice?: number }>;

  return {
    saleid,
    quotesid,
    clientid,
    typeofserviceid,
    fechainicio,
    fechafin,
    horainicio,
    horafin,
    viaticos,
    direccion,
    technicianid,
    servicerequestid: servicerequestid ?? undefined,
    serviceRequestId: servicerequestid ?? undefined,
    serviceid: serviceid ?? undefined,
    typeofservicename,
    technicians: techs,
    description,
    services,
    products,
  };
}


