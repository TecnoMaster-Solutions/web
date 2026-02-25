"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import RequireAuth from "@/features/auth/requireauth";
import { useAuth } from "@/features/auth/authcontext";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import Modal from "@/features/dashboard/components/Modal";
import { showInfo } from "@/shared/utils/notifications";
import {
  cancelOrderService,
  fetchOrderServiceHistory,
  fetchOrdersServices,
  finishOrderService,
  reportOrderServiceWarranty,
} from "@/features/dashboard/OrdersServices/api/ordersServices.api";
import type { OrderServiceDTO } from "@/features/dashboard/OrdersServices/types/ordersServices.types";

const ICONS = {
  edit: "/icons/Edit.svg",
  cancel: "/icons/minus-circle.svg",
  view: "/icons/Eye.svg",
  print: "/icons/printer.svg",
  report: "/icons/alert-triangle.svg",
  complete: "/icons/complete.svg",
};
const MODULE_KEY = "orderservices";
const TECH_COMPLETE_CONFIRM_TAG = "[TECH_COMPLETE_CONFIRM]";

type Row = {
  id: number;
  fechaProgramada: string;
  tipo: "Instalacion" | "Mantenimiento";
  tecnico: string;
  cliente: string;
  estado: string;
  estadoKey:
    | "Aprobada"
    | "Anulada"
    | "Pendiente"
    | "Finalizado"
    | "Agendada"
    | "Garantia"
    | "GarantiaReportada";
  monto?: number;
  viaticos?: number;
  descripcion?: string;
  servicios?: LineItem[];
  materiales?: LineItem[];
  garantia?: WarrantyInfo;
  files?: OrderFile[];
  fechainicio?: string;
  fechafin?: string;
  horainicio?: string;
  horafin?: string;
  createdat?: string;
  updatedat?: string;
};

type LineItem = { nombre: string; cantidad: number; precio?: number };

type WarrantyInfo = {
  label: string;
  reportedBy: string;
  reportedAtISO: string;
  details?: string;
  notifiedClient?: boolean;
};

type OrderFile = { label?: string; url: string };

function formatCOP(n?: number) {
  return n == null
    ? "-"
    : n.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      });
}

function formatDate(input?: string | null) {
  if (!input) return "-";
  const raw = String(input);
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (ymd) {
    const dt = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("es-CO");
  }
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("es-CO");
}

function nl2br(s: string) {
  return s.replace(/\n/g, "<br/>");
}

function formatDateES(input?: string | null) {
  if (!input) return "";
  const s = String(input);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d);
    return Number.isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("es-CO");
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("es-CO");
}

function formatDateTimeES(input?: string | null) {
  if (!input) return "";
  const dt = new Date(String(input));
  return Number.isNaN(dt.getTime()) ? "" : dt.toLocaleString("es-CO");
}

function formatTimeES(input?: string | null) {
  if (!input) return "";
  const s = String(input);
  if (s.length >= 5) return s.slice(0, 5);
  return s;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function pageList(totalPages: number, current: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(totalPages - 1, current + 1);
  if (left > 2) pages.push("...");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

function toPositiveId(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractAuthClientId(user: any, profile: any): number | null {
  const candidates = [
    user?.customerid,
    user?.clientid,
    user?.clientId,
    user?.customer?.customerid,
    user?.customers?.[0]?.customerid,
    user?.customer?.id,
    user?.customers?.[0]?.id,
    profile?.customerid,
    profile?.clientid,
    profile?.clientId,
    profile?.customer?.customerid,
    profile?.customers?.[0]?.customerid,
    profile?.customer?.id,
    profile?.customers?.[0]?.id,
  ];

  for (const candidate of candidates) {
    const id = toPositiveId(candidate);
    if (id) return id;
  }
  return null;
}

function extractOrderClientIds(o: any): number[] {
  const client = o?.client ?? o?.customer ?? o?.cliente ?? null;
  const ids = [
    o?.clientId,
    o?.clientid,
    o?.customerid,
    client?.customerid,
    client?.clientid,
    client?.id,
    client?.userid,
    client?.users?.userid,
    client?.users?.id,
  ];

  return Array.from(
    new Set(ids.map((id) => toPositiveId(id)).filter((id): id is number => id != null))
  );
}

function mapEstadoKey(name?: string | null): Row["estadoKey"] {
  const n = String(name ?? "").trim().toLowerCase();
  if (n.includes("garan") && (n.includes("report") || n.includes("rep"))) return "GarantiaReportada";
  if (n.includes("garan")) return "Garantia";
  if (n.includes("anul") || n.includes("cancel")) return "Anulada";
  if (n.includes("final") || n.includes("complet") || n.includes("finish")) return "Finalizado";
  if (n.includes("agend")) return "Agendada";
  if (n.includes("aprob") || n.includes("approved")) return "Aprobada";
  return "Pendiente";
}

function mapEstadoFromBackend(name?: string | null): string {
  const label = String(name ?? "").trim();
  if (label) return label;
  return mapEstadoKey(name);
}

function inferTipo(desc?: string | null): Row["tipo"] {
  const d = String(desc ?? "").toLowerCase();
  if (d.includes("instal")) return "Instalacion";
  return "Mantenimiento";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveWarrantyFromBackend(o: any): WarrantyInfo | undefined {
  const w =
    o?.warranty ??
    o?.warrantyReport ??
    o?.warrantyreport ??
    o?.garantia ??
    o?.garantiaReportada ??
    o?.warranty_info ??
    o?.warrantyInfo;
  if (!w) return undefined;

  const label = String(w.label ?? w.reason ?? w.motivo ?? "Garantia");
  const details = w.details ?? w.description ?? w.detalle ?? w.message ?? undefined;

  const notifiedClient =
    typeof w.notifiedClient === "boolean"
      ? w.notifiedClient
      : typeof w.notifiedclient === "boolean"
      ? w.notifiedclient
      : typeof w.notifyClient === "boolean"
      ? w.notifyClient
      : undefined;

  const reportedAtISO = String(
    w.reportedAtISO ?? w.reportedAt ?? w.reportedat ?? w.createdat ?? w.createdAt ?? new Date().toISOString()
  );

  const rb =
    w.reportedBy?.users
      ? [w.reportedBy.users.name, w.reportedBy.users.lastname].filter(Boolean).join(" ")
      : w.reportedByUser?.name
      ? [w.reportedByUser.name, w.reportedByUser.lastname].filter(Boolean).join(" ")
      : w.reportedBy?.name
      ? String(w.reportedBy.name)
      : w.reportedby?.name
      ? String(w.reportedby.name)
      : w.reportedByName
      ? String(w.reportedByName)
      : w.reportedbyname
      ? String(w.reportedbyname)
      : "";

  const reportedBy = rb?.trim() ? rb : "-";

  return { label, reportedBy, reportedAtISO, details, notifiedClient };
}

function resolveServicesFromBackend(anyO: any): LineItem[] {
  const arr =
    anyO?.services ??
    anyO?.servicios ??
    anyO?.ordersServicesServices ??
    anyO?.ordersservicesservices ??
    anyO?.orders_services_services ??
    [];
  const list = Array.isArray(arr) ? arr : [];

  return list
    .map((s: any) => {
      const svc = s?.service ?? s?.services ?? s?.servicio ?? s;
      const nombre =
        svc?.servicename ||
        svc?.name ||
        s?.servicename ||
        s?.name ||
        (svc?.serviceid ? `Servicio #${svc.serviceid}` : "Servicio");

      const cantidad = Number(s?.cantidad ?? s?.quantity ?? s?.qty ?? 0) || 0;

      const rawPrecio =
        svc?.servicepriceofsale ??
        svc?.serviceprice ??
        svc?.price ??
        s?.precio ??
        s?.price ??
        (typeof s?.subtotal === "number" && cantidad > 0 ? s.subtotal / cantidad : undefined);

      const precioNum = rawPrecio == null ? undefined : Number(rawPrecio);
      const precio = Number.isFinite(precioNum) ? precioNum : undefined;

      return { nombre: String(nombre), cantidad, precio };
    })
    .filter((x: LineItem) => x.cantidad > 0);
}

function resolveFilesFromBackend(anyO: any): OrderFile[] {
  const arr = anyO?.files ?? anyO?.attachments ?? anyO?.adjuntos ?? anyO?.documents ?? [];
  const list = Array.isArray(arr) ? arr : [];

  return list
    .map((f: any) => {
      if (typeof f === "string") return { url: f };
      const url = f?.url ?? f?.fileurl ?? f?.fileUrl ?? f?.path ?? f?.secure_url ?? f?.link ?? "";
      const label = f?.originalname ?? f?.originalName ?? f?.filename ?? f?.name ?? undefined;
      return { url: String(url || ""), label: label ? String(label) : undefined };
    })
    .filter((x: OrderFile) => !!x.url);
}

function toRow(order: OrderServiceDTO): Row {
  const o: any = order;
  const estadoFromApi = mapEstadoFromBackend(o?.state?.name);
  let estadoKey = mapEstadoKey(o?.state?.name);
  const tecnico =
    Array.isArray(o?.technicians) && o.technicians.length
      ? o.technicians
          .map((t: any) => [t?.users?.name, t?.users?.lastname].filter(Boolean).join(" ").trim())
          .filter(Boolean)
          .join(", ")
      : "-";

  const cliente =
    [o?.client?.users?.name, o?.client?.users?.lastname].filter(Boolean).join(" ").trim() ||
    (o?.client?.customerid ? `Cliente #${o.client.customerid}` : "-");

  const fechainicio = o?.fechainicio ?? o?.fechaInicio ?? o?.startdate ?? o?.startDate ?? null;
  const fechafin = o?.fechafin ?? o?.fechaFin ?? o?.enddate ?? o?.endDate ?? null;
  const horainicio = o?.horainicio ?? o?.horaInicio ?? o?.starttime ?? o?.startTime ?? null;
  const horafin = o?.horafin ?? o?.horaFin ?? o?.endtime ?? o?.endTime ?? null;

  const materiales: LineItem[] =
    o?.products?.map((p: any) => {
      const nombre = p.product?.productname || (p.product?.productid ? `Producto #${p.product.productid}` : "Producto");
      const cantidad = Number(p.cantidad) || 0;
      const rawPrecio =
        p.product?.productpriceofsale ??
        p.product?.productprice ??
        p.product?.price ??
        p.precio ??
        p.price ??
        (typeof p.subtotal === "number" && cantidad > 0 ? p.subtotal / cantidad : undefined);
      const precioNum = rawPrecio == null ? undefined : Number(rawPrecio);
      const precio = Number.isFinite(precioNum) ? precioNum : undefined;
      return { nombre: String(nombre), cantidad, precio };
    }) ?? [];

  const servicios = resolveServicesFromBackend(o);
  const garantia = resolveWarrantyFromBackend(o);
  if (garantia && estadoKey !== "GarantiaReportada" && estadoKey !== "Garantia") {
    estadoKey = garantia.details ? "GarantiaReportada" : "Garantia";
  }

  return {
    id: Number(o?.ordersservicesid ?? 0),
    fechaProgramada:
      formatDateES(fechainicio) ||
      formatDateES(o?.createdat ?? o?.createdAt ?? null) ||
      formatDate(o?.fechainicio ?? o?.createdat ?? null),
    tipo: inferTipo(o?.description),
    tecnico,
    cliente,
    estado: estadoFromApi || estadoKey,
    estadoKey,
    monto: Number.isFinite(Number(o?.total)) ? Number(o.total) : undefined,
    viaticos: Number.isFinite(Number(o?.viaticos)) ? Number(o.viaticos) : 0,
    descripcion: o?.description || "",
    servicios,
    materiales,
    garantia,
    files: resolveFilesFromBackend(o),
    fechainicio: fechainicio ? String(fechainicio) : undefined,
    fechafin: fechafin ? String(fechafin) : undefined,
    horainicio: horainicio ? String(horainicio) : undefined,
    horafin: horafin ? String(horafin) : undefined,
    createdat: o?.createdat ?? o?.createdAt ?? undefined,
    updatedat: o?.updatedat ?? o?.updatedAt ?? undefined,
  };
}

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function estadoBadgeClass(key: Row["estadoKey"]) {
  if (key === "Aprobada") return "bg-green-100 text-green-700 ring-1 ring-inset ring-green-200";
  if (key === "Pendiente") return "bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-200";
  if (key === "Agendada") return "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200";
  if (key === "Garantia" || key === "GarantiaReportada") return "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200";
  if (key === "Finalizado") return "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  return "bg-red-100 text-red-700 ring-1 ring-inset ring-red-200";
}

function tipoBadgeClass(tipo: Row["tipo"]) {
  if (tipo === "Instalacion") return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  return "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200";
}

export default function OrderServicesClientsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, ready } = useAuth();
  const { has, canCreate, canView, canUpdate, canDelete } = usePermissions();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportRowId, setReportRowId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("Daño dentro de garantía");
  const [detalle, setDetalle] = useState("");
  const [notifyClient, setNotifyClient] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");
  const pageSize = 6;

  const clientIdFromAuth = useMemo(
    () => extractAuthClientId(user, profile),
    [user, profile]
  );

  useEffect(() => {
    if (!ready) return;

    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const data = await fetchOrdersServices();
        const list = Array.isArray(data) ? data : [];
        const filtered = list.filter((o: any) => {
          if (!clientIdFromAuth) return false;
          const ids = extractOrderClientIds(o);
          return ids.includes(clientIdFromAuth);
        });
        const mapped = filtered
          .map(toRow)
          .filter((r) => r.id > 0)
          .sort((a, b) => b.id - a.id);
        if (!mounted) return;
        setRows(mapped);
      } catch {
        if (!mounted) return;
        setRows([]);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las ordenes.",
        });
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [clientIdFromAuth, ready]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return rows.filter((r) => {
      return (
        !q ||
        norm(r.fechaProgramada).includes(q) ||
        norm(r.tipo).includes(q) ||
        norm(r.tecnico).includes(q) ||
        norm(r.cliente).includes(q) ||
        norm(r.estado).includes(q) ||
        String(r.id).includes(q)
      );
    });
  }, [rows, query]);

  useEffect(() => setPage(1), [query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const end = start + pageSize;
  const paged = filtered.slice(start, end);
  const pages = pageList(totalPages, current);
  const canCreateOrder = canCreate(MODULE_KEY);
  const canViewOrder = canView(MODULE_KEY);
  const canUpdateOrder = canUpdate(MODULE_KEY);
  const canDeleteOrder = canDelete(MODULE_KEY);
  const canReportWarranty = canUpdateOrder || has(MODULE_KEY, "report_warranty");

  function openCreate() {
    router.push(`/dashboard/orders-services/new?returnTo=${encodeURIComponent(pathname)}`);
  }

  function openEdit(row: Row) {
    router.push(
      `/dashboard/orders-services/edit?ordersservicesid=${row.id}&returnTo=${encodeURIComponent(pathname)}`
    );
  }

  function openDetails(row: Row) {
    router.push(`/dashboard/orders/${row.id}`);
  }

  function printRow(row: Row) {
    const IVA_PCT = 19;
    const estadoKey = row.estadoKey ?? row.estado;

    const servicios = row.servicios ?? [];
    const materiales = row.materiales ?? [];

    const subServ = servicios.reduce((a, s) => a + (Number(s.cantidad) || 0) * (Number(s.precio) || 0), 0);
    const subMat = materiales.reduce((a, m) => a + (Number(m.cantidad) || 0) * (Number(m.precio) || 0), 0);

    const viaticos = Math.max(0, Math.round(Number(row.viaticos) || 0));

    const subtotalBaseIVA = Math.max(0, Math.round(subServ + subMat + viaticos));
    const iva = Math.max(0, Math.round((subtotalBaseIVA * IVA_PCT) / 100));

    const totalCalculado = Math.max(0, Math.round(subtotalBaseIVA + iva));
    const totalRegistrado = Math.max(0, Math.round(Number(row.monto) || 0));
    const diff = Math.round(totalRegistrado - totalCalculado);

    const serviciosRows =
      servicios.length === 0
        ? `<tr><td colspan="4" class="empty">-</td></tr>`
        : servicios
            .map((s) => {
              const cant = Number(s.cantidad) || 0;
              const precio = Number(s.precio) || 0;
              const imp = Math.max(0, Math.round(cant * precio));
              return `<tr>
<td>${escapeHtml(s.nombre)}</td>
<td class="num">${cant}</td>
<td class="num">${escapeHtml(formatCOP(precio))}</td>
<td class="num">${escapeHtml(formatCOP(imp))}</td>
</tr>`;
            })
            .join("");

    const materialesRows =
      materiales.length === 0
        ? `<tr><td colspan="4" class="empty">-</td></tr>`
        : materiales
            .map((m) => {
              const cant = Number(m.cantidad) || 0;
              const precio = Number(m.precio) || 0;
              const imp = Math.max(0, Math.round(cant * precio));
              return `<tr>
<td>${escapeHtml(m.nombre)}</td>
<td class="num">${cant}</td>
<td class="num">${escapeHtml(formatCOP(precio))}</td>
<td class="num">${escapeHtml(formatCOP(imp))}</td>
</tr>`;
            })
            .join("");

    const garantiaBlock = row.garantia
      ? `<div class="section">
<div class="label" style="margin-bottom:6px">Garantia</div>
<div class="grid">
  <div class="item"><div class="label">Estado</div><div class="val">${
    estadoKey === "GarantiaReportada" ? "Garantia (reportada)" : "Garantia"
  }</div></div>
  <div class="item"><div class="label">Motivo</div><div class="val">${escapeHtml(row.garantia.label)}</div></div>
  <div class="item"><div class="label">Reportado por</div><div class="val">${escapeHtml(row.garantia.reportedBy)}</div></div>
  <div class="item"><div class="label">Fecha reporte</div><div class="val">${escapeHtml(
    formatDateTimeES(row.garantia.reportedAtISO)
  )}</div></div>
  <div class="item" style="grid-column:1 / -1"><div class="label">Detalle</div><div class="val">${
    row.garantia.details ? nl2br(escapeHtml(row.garantia.details)) : "-"
  }</div></div>
  <div class="item" style="grid-column:1 / -1"><div class="label">Cliente notificado</div><div class="val">${
    typeof row.garantia.notifiedClient === "boolean" ? (row.garantia.notifiedClient ? "Si" : "No") : "-"
  }</div></div>
</div>
</div>`
      : "";

    const files = row.files ?? [];
    const filesBlock =
      files.length === 0
        ? `<div class="item" style="grid-column:1 / -1"><div class="label">Archivos</div><div class="val">-</div></div>`
        : `<div class="item" style="grid-column:1 / -1"><div class="label">Archivos</div>
            <div class="val">
              <ul class="list">
                ${files
                  .map((f) => {
                    const label = f.label ? escapeHtml(f.label) : "Archivo";
                    const url = escapeHtml(f.url);
                    return `<li><span class="muted">${label}:</span> <span class="mono">${url}</span></li>`;
                  })
                  .join("")}
              </ul>
            </div>
          </div>`;

    const html = `<!doctype html><html lang="es"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Orden #${row.id}</title>
<style>
:root{color-scheme:light}
body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans";margin:24px;color:#111827}
.hwrap{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin:0 0 12px 0}
.h{font-size:20px;font-weight:800;margin:0}
.sub{font-size:12px;color:#6b7280;margin-top:2px}
.badge{display:inline-flex;align-items:center;gap:8px;border:1px solid #e5e7eb;border-radius:999px;padding:6px 10px;background:#fff}
.dot{width:8px;height:8px;border-radius:999px;background:#B20000}
.card{border:1px solid #e5e7eb;border-radius:12px;padding:20px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}
.item{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px}
.label{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;margin-bottom:4px}
.val{font-size:14px;line-height:1.35}
.section{margin-top:18px}
.table{width:100%;border-collapse:collapse;font-size:13px}
.table th,.table td{border-top:1px solid #e5e7eb;padding:8px;vertical-align:top}
.table th{background:#f3f4f6;text-align:left;font-weight:700}
.table td.num{text-align:right;white-space:nowrap}
.empty{color:#6b7280;text-align:center;padding:10px}
.tot{width:100%;margin-top:12px}
.tot .row{display:flex;justify-content:space-between;padding:6px 0;gap:12px}
.tot .row.b{border-top:1px solid #e5e7eb;margin-top:6px;padding-top:10px;font-weight:800}
.footer{display:flex;justify-content:space-between;gap:12px;margin-top:14px;font-size:12px;color:#6b7280}
.muted{color:#6b7280}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
.list{margin:6px 0 0 18px;padding:0}
.list li{margin:4px 0}
.warn{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:10px;padding:10px 12px;font-size:12px;margin-top:10px}
.note{background:#f8fafc;border:1px solid #e2e8f0;color:#334155;border-radius:10px;padding:10px 12px;font-size:12px;margin-top:10px}
@media print{@page{size:A4;margin:16mm}body{margin:0}.card{border:0}}
</style>
</head><body>
<div class="card">
  <div class="hwrap">
    <div>
      <div class="h">Orden de servicio #${row.id}</div>
      <div class="sub">Codigo: <span class="mono">OS-${String(row.id).padStart(6, "0")}</span></div>
    </div>
    <div class="badge"><span class="dot"></span><span style="font-weight:700">Vertecx</span></div>
  </div>

  <div class="grid">
    <div class="item"><div class="label">Estado</div><div class="val">${escapeHtml(
      estadoKey === "GarantiaReportada" ? "Garantia (reportada)" : row.estado
    )}</div></div>
    <div class="item"><div class="label">Tipo</div><div class="val">${escapeHtml(row.tipo)}</div></div>
    <div class="item"><div class="label">Cliente</div><div class="val">${escapeHtml(row.cliente)}</div></div>
    <div class="item"><div class="label">Tecnicos</div><div class="val">${escapeHtml(row.tecnico || "-")}</div></div>
    <div class="item"><div class="label">Fecha inicio</div><div class="val">${escapeHtml(formatDateES(row.fechainicio) || "-")}</div></div>
    <div class="item"><div class="label">Fecha fin</div><div class="val">${escapeHtml(formatDateES(row.fechafin) || "-")}</div></div>
    <div class="item"><div class="label">Hora inicio</div><div class="val">${escapeHtml(formatTimeES(row.horainicio) || "-")}</div></div>
    <div class="item"><div class="label">Hora fin</div><div class="val">${escapeHtml(formatTimeES(row.horafin) || "-")}</div></div>
    <div class="item"><div class="label">Fecha programada</div><div class="val">${escapeHtml(row.fechaProgramada || "-")}</div></div>
    <div class="item"><div class="label">Viaticos</div><div class="val">${escapeHtml(formatCOP(viaticos))}</div></div>
    <div class="item"><div class="label">Total (registrado)</div><div class="val"><b>${escapeHtml(formatCOP(totalRegistrado))}</b></div></div>
    <div class="item"><div class="label">Creada</div><div class="val">${escapeHtml(formatDateTimeES(row.createdat) || "-")}</div></div>
    <div class="item"><div class="label">Actualizada</div><div class="val">${escapeHtml(formatDateTimeES(row.updatedat) || "-")}</div></div>
    <div class="item" style="grid-column:1 / -1">
      <div class="label">Descripcion</div>
      <div class="val">${row.descripcion ? nl2br(escapeHtml(row.descripcion)) : "-"}</div>
    </div>
    ${filesBlock}
  </div>

  <div class="section">
    <div class="label" style="margin-bottom:6px">Servicios</div>
    <table class="table">
      <thead><tr><th>Servicio</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
      <tbody>${serviciosRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="label" style="margin-bottom:6px">Materiales</div>
    <table class="table">
      <thead><tr><th>Material</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
      <tbody>${materialesRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="label" style="margin-bottom:6px">Totales (IVA desde subtotal con viaticos)</div>
    <div class="tot">
      <div class="row"><span>Subtotal servicios</span><span>${escapeHtml(formatCOP(subServ))}</span></div>
      <div class="row"><span>Subtotal materiales</span><span>${escapeHtml(formatCOP(subMat))}</span></div>
      <div class="row"><span>Viaticos</span><span>${escapeHtml(formatCOP(viaticos))}</span></div>
      <div class="row"><span>Subtotal (base IVA)</span><span>${escapeHtml(formatCOP(subtotalBaseIVA))}</span></div>
      <div class="row"><span>IVA (${IVA_PCT}%)</span><span>${escapeHtml(formatCOP(iva))}</span></div>
      <div class="row b"><span>Total calculado</span><span>${escapeHtml(formatCOP(totalCalculado))}</span></div>
    </div>
    <div class="note">El IVA se calcula sobre el subtotal (servicios + materiales + viaticos).</div>
    ${
      totalRegistrado > 0 && diff !== 0
        ? `<div class="warn">Nota: el <b>Total (registrado)</b> difiere del <b>Total calculado</b> por ${escapeHtml(
            formatCOP(diff)
          )}.</div>`
        : ""
    }
  </div>

  ${garantiaBlock}

  <div class="footer">
    <span class="muted">Impreso: ${escapeHtml(new Date().toLocaleString("es-CO"))}</span>
    <span class="muted">Modulo: ${escapeHtml(MODULE_KEY)}</span>
  </div>
</div>
</body></html>`;

    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
    });

    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) return cleanup();

      const done = () => cleanup();
      win.onafterprint = done;

      setTimeout(() => {
        try {
          win.focus?.();
          win.print?.();
        } finally {
          setTimeout(done, 1200);
        }
      }, 50);
    };

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  }

  function openReport(row: Row) {
    if (row.estadoKey === "Anulada") return;
    setReportRowId(row.id);
    setMotivo("Daño dentro de garantía");
    setDetalle("");
    setNotifyClient(false);
    setErrorDetalle("");
    setReportOpen(true);
  }

  async function submitReport() {
    if (!detalle.trim()) {
      setErrorDetalle("Describe qué pasó");
      return;
    }
    if (reportRowId == null) return;

    try {
      const updated = await reportOrderServiceWarranty(reportRowId, {
        label: motivo,
        details: detalle.trim(),
        notifiedClient: notifyClient,
      });
      const updatedRow = toRow(updated);
      setRows((prev) =>
        prev.map((r) => (r.id === reportRowId ? { ...r, ...updatedRow } : r))
      );
      setReportOpen(false);
      setReportRowId(null);
      await Swal.fire({
        icon: "success",
        title: "Reporte guardado",
        text: `Se registró el reporte de garantía para la orden #${reportRowId}.`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el reporte de garantía.",
      });
    }
  }

  async function completeOrder(row: Row) {
    if (row.estadoKey === "Anulada" || row.estadoKey === "Finalizado") return;

    let hasTechnicianConfirmation = false;
    try {
      const history = await fetchOrderServiceHistory(row.id);
      hasTechnicianConfirmation = Array.isArray(history)
        ? history.some((item: any) => String(item?.message ?? "").includes(TECH_COMPLETE_CONFIRM_TAG))
        : false;
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo validar la confirmacion del tecnico.",
      });
      return;
    }

    if (!hasTechnicianConfirmation) {
      showInfo("El técnico debe finalizar primero la cita para que puedas completar la orden.");
      return;
    }
    const res = await Swal.fire({
      title: "Completar orden de servicio",
      text: `La orden #${row.id} se marcará como finalizada.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, completar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (!res.isConfirmed) return;

    const now = new Date();
    const fechafin = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const horafin = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    try {
      const updated = await finishOrderService(row.id, { fechafin, horafin });
      const updatedRow = toRow(updated);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, ...updatedRow } : r))
      );
      await Swal.fire({
        icon: "success",
        title: "Orden completada",
        text: "La orden de servicio fue finalizada.",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo completar la orden.",
      });
    }
  }

  async function cancelRow(row: Row) {
    if (row.estadoKey === "Anulada") return;
    const res = await Swal.fire({
      title: "Cancelar orden?",
      text: `Se cancelará la orden #${row.id}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
      confirmButtonColor: "#d33",
      reverseButtons: true,
    });
    if (!res.isConfirmed) return;

    try {
      const updated = await cancelOrderService(row.id);
      const updatedRow = toRow(updated);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, ...updatedRow } : r))
      );
      await Swal.fire({
        icon: "success",
        title: "Cancelada",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cancelar la orden.",
      });
    }
  }

  return (
    <RequireAuth>
      <main className="flex-1 flex flex-col bg-gray-100">
        <div className="px-4 pb-8 pt-4 max-w-7xl w-full mx-auto">
          <div className="mb-5 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar (id, tecnico, cliente, tipo, estado, fecha)"
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200 md:flex-1"
                />
                {canCreateOrder && (
                  <button
                    onClick={openCreate}
                    className="inline-flex h-10 items-center rounded-md bg-[#B20000] px-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 whitespace-nowrap"
                  >
                    Crear Orden
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
              Cargando ordenes...
            </div>
          ) : (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              key={`${page}-${query}`}
              className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence>
                {paged.map((row) => (
                  <motion.article
                    key={row.id}
                    variants={cardVariants}
                    exit={{ opacity: 0, y: 8 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex h-7 items-center rounded-md bg-gray-100 px-2.5 text-xs font-bold text-gray-800 ring-1 ring-inset ring-gray-200">
                            Orden #{row.id}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${tipoBadgeClass(
                              row.tipo
                            )}`}
                          >
                            {row.tipo}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 leading-tight break-words">
                            {row.cliente}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Programada: {row.fechaProgramada}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${estadoBadgeClass(
                          row.estadoKey
                        )}`}
                      >
                        {row.estado}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">Técnico</p>
                        <p className="mt-1 text-sm font-medium text-gray-800 break-words">{row.tecnico}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500">Fecha</p>
                          <p className="mt-1 text-sm font-medium text-gray-800">{row.fechaProgramada}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500">Monto</p>
                          <p className="mt-1 text-sm font-bold text-gray-900">{formatCOP(row.monto)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-2">
                        {canUpdateOrder && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openEdit(row)}
                            title="Editar"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-50"
                          >
                            <img src={ICONS.edit} className="h-4 w-4" alt="" />
                          </motion.button>
                        )}
                        {canDeleteOrder && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => cancelRow(row)}
                            disabled={row.estadoKey === "Anulada"}
                            title="Cancelar"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50"
                          >
                            <img src={ICONS.cancel} className="h-4 w-4" alt="" />
                          </motion.button>
                        )}
                        {canViewOrder && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openDetails(row)}
                            title="Ver detalle"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-50"
                          >
                            <img src={ICONS.view} className="h-4 w-4" alt="" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => printRow(row)}
                          title="Imprimir"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-50"
                        >
                          <img src={ICONS.print} className="h-4 w-4" alt="" />
                        </motion.button>
                      </div>
                      <div className="mt-2 flex w-full items-center justify-end gap-2">
                        {canReportWarranty && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openReport(row)}
                            disabled={row.estadoKey === "Anulada"}
                            title="Reportar garant?a"
                            className="inline-flex h-8 items-center justify-center gap-2 rounded-full border border-[#B20000] bg-[#B20000] px-3 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                          >
                            <img src={ICONS.report} className="h-4 w-4 brightness-0 invert" alt="" />
                            Reportar garantía
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => completeOrder(row)}
                          disabled={row.estadoKey === "Anulada" || row.estadoKey === "Finalizado"}
                          title="Completar orden"
                          className="inline-flex h-8 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          <img src={ICONS.complete} className="h-4 w-4 brightness-0" alt="" />
                          Completar
                        </motion.button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && paged.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 mt-4">
              No hay ordenes para mostrar.
            </div>
          )}

          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current === 1}
                className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
              >
                Anterior
              </motion.button>
              {pages.map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="px-2 text-sm text-gray-500">
                    ...
                  </span>
                ) : (
                  <motion.button
                    key={p}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(p as number)}
                    className={`h-9 min-w-9 px-3 rounded-md border text-sm ${
                      current === p
                        ? "bg-[#CC0000] border-[#CC0000] text-white"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {p}
                  </motion.button>
                )
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current === totalPages}
                className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm disabled:opacity-50"
              >
                Siguiente
              </motion.button>
            </div>
          </div>
        </div>
      </main>

      <Modal
        title={reportRowId ? `Reportar garantía #${reportRowId}` : "Reportar garantía"}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        widthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="cursor-pointer inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submitReport}
              className="cursor-pointer inline-flex h-9 items-center rounded-md bg-[#B20000] px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              Guardar reporte
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">Motivo</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#B20000]/30"
            >
              <option>Daño dentro de garantía</option>
              <option>Producto defectuoso</option>
              <option>Instalación con falla</option>
              <option>Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">¿Qué pasó?</label>
            <textarea
              value={detalle}
              onChange={(e) => {
                setDetalle(e.target.value);
                if (e.target.value.trim()) setErrorDetalle("");
              }}
              rows={4}
              placeholder="Describe brevemente el caso de garantía"
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${
                errorDetalle ? "border-red-500 focus:ring-red-200" : "focus:ring-[#B20000]/30"
              }`}
            />
            {errorDetalle ? <p className="text-xs text-red-600 mt-1">{errorDetalle}</p> : null}
          </div>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={notifyClient}
              onChange={(e) => setNotifyClient(e.target.checked)}
            />
            <span className="text-sm">Notificar al cliente</span>
          </label>

          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            Al guardar, la orden pasará a <b>Garantía (reportada)</b>.
          </div>
        </div>
      </Modal>
    </RequireAuth>
  );
}

