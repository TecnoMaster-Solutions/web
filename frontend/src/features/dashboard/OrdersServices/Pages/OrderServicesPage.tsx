"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import RequireAuth from "@/features/auth/requireauth";
import Modal from "@/features/dashboard/components/Modal";
import Colors from "@/shared/theme/colors";
import { showError, showSuccess } from "@/shared/utils/notifications";
import { useAuth } from "@/features/auth/authcontext";

import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import { Column } from "@/features/dashboard/components/datatable/types/column.types";

import {
  fetchOrdersServices,
  markOrderServiceWarranty,
  reportOrderServiceWarranty,
  cancelOrderService,
} from "@/features/dashboard/OrdersServices/api/ordersServices.api";

import type { OrderServiceDTO } from "@/features/dashboard/OrdersServices/types/ordersServices.types";

import OrderServiceHistoryCreateModal from "@/features/dashboard/OrdersServices/components/OrderServiceHistoryCreateModal";
import { FilePlus2 } from "lucide-react";

const MODULE_KEY = "orders-services";

const ICONS = {
  print: "/icons/printer.svg",
  report: "/icons/alert-triangle.svg",
};

type FlashToast = { type: "success" | "error" | "warning"; message: string };

function consumeFlashToast(): FlashToast | null {
  try {
    const raw = sessionStorage.getItem("flash_toast");
    if (!raw) return null;

    sessionStorage.removeItem("flash_toast");

    const data = JSON.parse(raw);
    const type = data?.type;
    const message = String(data?.message || "").trim();

    if (!message) return null;
    if (type !== "success" && type !== "error" && type !== "warning") return null;

    return { type, message };
  } catch {
    try {
      sessionStorage.removeItem("flash_toast");
    } catch {}
    return null;
  }
}

type RowTipo = "Instalación" | "Mantenimiento";
type LineItem = { nombre: string; cantidad: number; precio?: number };

type WarrantyInfo = {
  label: string;
  reportedBy: string;
  reportedAtISO: string;
  details?: string;
  notifiedClient?: boolean;
};

type Estado = string;

type TechnicianOption = { technicianid: number; label: string };
type OrderFile = { label?: string; url: string };

type Row = {
  id: number;
  cliente: string;
  tecnico: string;
  tipo: RowTipo | string;

  fechaProgramada: string;
  fechainicio?: string;
  fechafin?: string;
  horainicio?: string;
  horafin?: string;

  estado: Estado;
  estadoKey?: Estado;
  monto?: number;
  viaticos?: number;

  descripcion?: string;
  servicios?: LineItem[];
  materiales?: LineItem[];

  garantia?: WarrantyInfo;
  technicians?: TechnicianOption[];

  files?: OrderFile[];
  createdat?: string;
  updatedat?: string;
};

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function sortRowsByIdDesc(arr: Row[]) {
  return [...arr].sort((a, b) => b.id - a.id);
}

function formatCOP(n?: number) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function EstadoText({ v, colorKey }: { v: Estado; colorKey?: string }) {
  const STYLE: Record<string, string> = {
    Aprobada: "text-green-700",
    Pendiente: "text-yellow-700",
    Agendada: "text-sky-700",
    Anulada: "text-red-700",
    Garantia: "text-blue-700",
    GarantiaReportada: "text-blue-700",
    Finalizado: "text-emerald-700",
  };

  const key = colorKey ?? v;
  const label = key === "GarantiaReportada" ? "Garantía (reportada)" : v;
  const colorClass = STYLE[key] ?? "text-slate-700";

  return (
    <span className={`text-sm font-semibold ${colorClass}`} title={label}>
      {label}
    </span>
  );
}

function escapeHtml(s: any) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("es-CO");
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("es-CO");
}

function formatDateTimeES(input?: string | null) {
  if (!input) return "";
  const dt = new Date(String(input));
  return isNaN(dt.getTime()) ? "" : dt.toLocaleString("es-CO");
}

function formatTimeES(input?: string | null) {
  if (!input) return "";
  const s = String(input);
  if (s.length >= 5) return s.slice(0, 5);
  return s;
}

function mapEstadoFromBackend(name?: string | null): Estado {
  const label = String(name ?? "").trim();
  if (label) return label;

  const n = label.toLowerCase();
  if (n.includes("final") || n.includes("complet") || n.includes("finish")) return "Finalizado";
  if (n.includes("anul") || n.includes("revoke") || n.includes("cancel")) return "Anulada";
  if (n.includes("aprob") || n.includes("approved")) return "Aprobada";
  if (n.includes("agend")) return "Agendada";
  if (n.includes("pend")) return "Pendiente";
  if (n.includes("garan") && (n.includes("report") || n.includes("rep"))) return "GarantiaReportada";
  if (n.includes("garan")) return "Garantia";
  return "Pendiente";
}

function mapEstadoKey(name?: string | null): Estado {
  const n = String(name ?? "").trim().toLowerCase();
  if (n.includes("final") || n.includes("complet") || n.includes("finish")) return "Finalizado";
  if (n.includes("anul") || n.includes("revoke") || n.includes("cancel")) return "Anulada";
  if (n.includes("aprob") || n.includes("approved")) return "Aprobada";
  if (n.includes("agend")) return "Agendada";
  if (n.includes("pend")) return "Pendiente";
  if (n.includes("garan") && (n.includes("report") || n.includes("rep"))) return "GarantiaReportada";
  if (n.includes("garan")) return "Garantia";
  return "Pendiente";
}

function inferTipo(desc?: string | null): RowTipo {
  const d = (desc || "").toLowerCase();
  if (d.includes("instal")) return "Instalación";
  if (d.includes("manten")) return "Mantenimiento";
  return "Mantenimiento";
}

function normalizeRoleName(role: any) {
  return String(role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
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

function extractAuthTechnicianId(user: any, profile: any): number | null {
  const candidates = [
    user?.technicianid,
    user?.technicianId,
    user?.technician?.technicianid,
    user?.technicians?.[0]?.technicianid,
    user?.technician?.id,
    user?.technicians?.[0]?.id,
    profile?.technicianid,
    profile?.technicianId,
    profile?.technician?.technicianid,
    profile?.technicians?.[0]?.technicianid,
    profile?.technician?.id,
    profile?.technicians?.[0]?.id,
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
    new Set(
      ids
        .map((id) => toPositiveId(id))
        .filter((id): id is number => id != null)
    )
  );
}

function extractOrderTechnicianIds(o: any): number[] {
  const pools = [o?.technicians, o?.assignedTechnicians, o?.technician, o?.techs];
  const ids: number[] = [];

  pools.forEach((pool) => {
    if (!Array.isArray(pool)) return;
    pool.forEach((tech: any) => {
      ids.push(
        toPositiveId(tech?.technicianid),
        toPositiveId(tech?.technicianId),
        toPositiveId(tech?.id),
        toPositiveId(tech?.users?.userid),
        toPositiveId(tech?.userid)
      );
    });
  });

  return Array.from(new Set(ids.filter((id): id is number => id != null)));
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

  const label = String(w.label ?? w.reason ?? w.motivo ?? "Garantía");
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

  const reportedBy = rb?.trim() ? rb : "—";

  return {
    label,
    reportedBy,
    reportedAtISO,
    details,
    notifiedClient,
  };
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

function toRow(o: OrderServiceDTO): Row {
  const anyO: any = o as any;

  const cliente =
    anyO?.client?.users
      ? [anyO.client.users.name, anyO.client.users.lastname].filter(Boolean).join(" ") ||
        `Cliente #${anyO.client.customerid}`
      : anyO?.client?.customerid
      ? `Cliente #${anyO.client.customerid}`
      : "—";

  const technicians: TechnicianOption[] =
    anyO?.technicians
      ?.map((t: any) => {
        const u = t.users;
        const name = u ? [u.name, u.lastname].filter(Boolean).join(" ") : "";
        return {
          technicianid: Number(t.technicianid) || 0,
          label: name || `Técnico #${t.technicianid}`,
        };
      })
      ?.filter((t: TechnicianOption) => t.technicianid > 0) ?? [];

  const tecnico = technicians.length ? technicians.map((t) => t.label).join(", ") : "—";

  const fechainicio = anyO?.fechainicio ?? anyO?.fechaInicio ?? anyO?.startdate ?? anyO?.startDate ?? null;
  const fechafin = anyO?.fechafin ?? anyO?.fechaFin ?? anyO?.enddate ?? anyO?.endDate ?? null;

  const horainicio = anyO?.horainicio ?? anyO?.horaInicio ?? anyO?.starttime ?? anyO?.startTime ?? null;
  const horafin = anyO?.horafin ?? anyO?.horaFin ?? anyO?.endtime ?? anyO?.endTime ?? null;

  const fechaProgramada =
    formatDateES(fechainicio) ||
    formatDateES(anyO?.createdat) ||
    formatDateES(anyO?.createdAt) ||
    new Date().toLocaleDateString("es-CO");

  const materiales: LineItem[] =
    anyO?.products?.map((p: any) => {
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

  const servicios = resolveServicesFromBackend(anyO);

  const total = typeof anyO?.total === "number" ? anyO.total : Number(anyO?.total) || 0;
  const viaticos = typeof anyO?.viaticos === "number" ? anyO.viaticos : Number(anyO?.viaticos) || 0;

  const garantia = resolveWarrantyFromBackend(anyO);

  const rawEstadoName = anyO?.state?.name;
  let estado = mapEstadoFromBackend(rawEstadoName);
  let estadoKey = mapEstadoKey(rawEstadoName);

  if (garantia && estadoKey !== "GarantiaReportada" && estadoKey !== "Garantia") {
    estadoKey = garantia.details ? "GarantiaReportada" : "Garantia";
    if (!estado) estado = estadoKey;
  }

  return {
    id: anyO?.ordersservicesid,
    cliente,
    tecnico,
    tipo: inferTipo(anyO?.description),
    fechaProgramada,
    fechainicio: fechainicio ? String(fechainicio) : undefined,
    fechafin: fechafin ? String(fechafin) : undefined,
    horainicio: horainicio ? String(horainicio) : undefined,
    horafin: horafin ? String(horafin) : undefined,
    estado,
    estadoKey,
    monto: total,
    viaticos,
    descripcion: anyO?.description || "",
    servicios,
    materiales,
    technicians,
    garantia,
    files: resolveFilesFromBackend(anyO),
    createdat: anyO?.createdat ?? anyO?.createdAt ?? undefined,
    updatedat: anyO?.updatedat ?? anyO?.updatedAt ?? undefined,
  };
}

export default function OrdersServicesIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportRowId, setReportRowId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("Daño dentro de garantía");
  const [detalle, setDetalle] = useState("");
  const [notifyClient, setNotifyClient] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyOrderId, setHistoryOrderId] = useState<number | null>(null);
  const [historyTechnicians, setHistoryTechnicians] = useState<TechnicianOption[]>([]);

  const bodyOverflowRef = useRef<string | null>(null);
  const cancelHandledRef = useRef(false);
  const { user, profile } = useAuth();

  const normalizedRole = useMemo(() => {
    const candidates = [
      user?.rolename,
      (user as any)?.role,
      (user as any)?.role?.name,
      (user as any)?.roles?.name,
      profile?.rolename,
      (profile as any)?.role,
      (profile as any)?.role?.name,
      (profile as any)?.roles?.name,
    ];

    const normalized = candidates
      .map((r) => normalizeRoleName(r))
      .find((r) => !!r);

    return normalized || "";
  }, [user, profile]);

  const isClientRole = useMemo(
    () =>
      normalizedRole === "cliente" ||
      normalizedRole === "client" ||
      normalizedRole === "customer",
    [normalizedRole]
  );

  const isTechnicianRole = useMemo(
    () => normalizedRole === "tecnico" || normalizedRole === "technician",
    [normalizedRole]
  );

  const clientIdFromAuth = useMemo(() => {
    if (!isClientRole) return null;
    return extractAuthClientId(user, profile);
  }, [isClientRole, user, profile]);

  const technicianIdFromAuth = useMemo(() => {
    if (!isTechnicianRole) return null;
    return extractAuthTechnicianId(user, profile);
  }, [isTechnicianRole, user, profile]);

  const filterOrdersForAuth = useCallback(
    (list: any[]) => {
      const arr = Array.isArray(list) ? list : [];
      return arr.filter((o) => {
        if (isClientRole) {
          const clientIds = extractOrderClientIds(o);
          const targetClientId = clientIdFromAuth ?? -1;
          if (!clientIds.includes(targetClientId)) return false;
        }

        if (isTechnicianRole) {
          const techIds = extractOrderTechnicianIds(o);
          const targetTechId = technicianIdFromAuth ?? -1;
          if (!techIds.includes(targetTechId)) return false;
        }

        return true;
      });
    },
    [clientIdFromAuth, isClientRole, isTechnicianRole, technicianIdFromAuth]
  );

  // ✅ Disparar notificación al aterrizar desde /new (flash toast)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const toast = consumeFlashToast();
    if (!toast) return;

    if (toast.type === "success") {
      showSuccess(toast.message);
      return;
    }

    if (toast.type === "error") {
      showError(toast.message);
      return;
    }

    // warning
    Swal.fire({
      icon: "warning",
      title: "Atención",
      text: toast.message,
      confirmButtonColor: "#B20000",
    });
  }, [filterOrdersForAuth]);

  useEffect(() => {
    if (cancelHandledRef.current) return;

    const action = searchParams.get("action");
    const targetId = searchParams.get("orderId") ?? searchParams.get("id");

    if (action !== "cancel" || !targetId) return;
    if (loading || busy) return;

    const clearParams = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      params.delete("orderId");
      params.delete("id");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    const row = rows.find((r) => String(r.id) === String(targetId));
    if (!row) {
      cancelHandledRef.current = true;
      showError("No se encontró la orden para cancelar.");
      clearParams();
      return;
    }

    cancelHandledRef.current = true;
    void (async () => {
      await cancelRow(row);
      clearParams();
    })();
  }, [searchParams, loading, busy, rows, router, pathname]);

  const reloadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrdersServices();
      const filtered = filterOrdersForAuth(Array.isArray(data) ? data : []);
      const mapped = filtered.map(toRow);
      setRows(sortRowsByIdDesc(mapped));
    } catch {
      setRows([]);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las órdenes desde el backend.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchOrdersServices();
        const filtered = filterOrdersForAuth(Array.isArray(data) ? data : []);
        const mapped = filtered.map(toRow);
        if (!mounted) return;
        setRows(sortRowsByIdDesc(mapped));
      } catch {
        if (!mounted) return;
        setRows([]);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las órdenes desde el backend.",
        });
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [filterOrdersForAuth]);

  useEffect(() => {
    const anyOpen = reportOpen || historyOpen;

    if (anyOpen) {
      if (bodyOverflowRef.current === null) bodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return;
    }

    if (bodyOverflowRef.current !== null) {
      document.body.style.overflow = bodyOverflowRef.current;
      bodyOverflowRef.current = null;
    }
  }, [reportOpen, historyOpen]);

  const openCreate = useCallback(() => {
    router.push(`/dashboard/orders-services/new?returnTo=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  const openEdit = useCallback(
    (r: Row) => {
      const payload = encodeURIComponent(JSON.stringify(r));
      router.push(`/dashboard/orders-services/edit?returnTo=${encodeURIComponent(pathname)}&id=${r.id}&order=${payload}`);
    },
    [router, pathname]
  );

  const openDetail = useCallback(
    (r: Row) => {
      router.push(`/dashboard/orders/${r.id}`);
    },
    [router]
  );

  const cancelRow = useCallback(
    async (row: Row) => {
      const estadoKey = row.estadoKey ?? row.estado;
      if (estadoKey === "Anulada") return;

      const res = await Swal.fire({
        icon: "warning",
        title: "Cancelar orden",
        text: `¿Deseas cancelar la orden #${row.id}?`,
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "Volver",
        confirmButtonColor: "#B20000",
      });
      if (!res.isConfirmed) return;

      setBusy(true);
      try {
        await cancelOrderService(row.id);

        await Swal.fire({
          icon: "success",
          title: "Orden cancelada",
          text: `La orden #${row.id} fue cancelada correctamente.`,
          confirmButtonColor: "#B20000",
        });

        await reloadOrders();
      } catch (e: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e?.response?.data?.message?.[0] || e?.response?.data?.message || "No se pudo cancelar la orden.",
          confirmButtonColor: "#B20000",
        });
      } finally {
        setBusy(false);
      }
    },
    [reloadOrders]
  );

  const markWarranty = useCallback(
    async (row: Row) => {
      setBusy(true);
      try {
        await markOrderServiceWarranty(row.id);
        showSuccess(`La orden #${row.id} quedó marcada en garantía.`);
        await reloadOrders();
      } catch (e: any) {
        const message = e?.response?.data?.message?.[0] || e?.response?.data?.message || "No se pudo marcar la garantía.";
        showError(message);
      } finally {
        setBusy(false);
      }
    },
    [reloadOrders]
  );

  const openReport = useCallback((row: Row) => {
    setReportRowId(row.id);
    setMotivo(row.garantia?.label || "Daño dentro de garantía");
    setDetalle(row.garantia?.details || "");
    setNotifyClient(!!row.garantia?.notifiedClient);
    setErrorDetalle("");
    setReportOpen(true);
  }, []);

  const submitReport = useCallback(
    async () => {
      if (!detalle.trim()) {
        setErrorDetalle("Describe qué pasó");
        return;
      }
      if (reportRowId == null) return;

      setBusy(true);
      try {
        await reportOrderServiceWarranty(reportRowId, {
          label: motivo,
          details: detalle.trim(),
          notifiedClient: notifyClient,
        });

        setReportOpen(false);

        await Swal.fire({
          icon: "success",
          title: "Reporte guardado",
          text: `Se registró el reporte de garantía para la orden #${reportRowId}.`,
          confirmButtonColor: "#B20000",
        });

        await reloadOrders();
      } catch (e: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            e?.response?.data?.message?.[0] ||
            e?.response?.data?.message ||
            "No se pudo guardar el reporte de garantía.",
          confirmButtonColor: "#B20000",
        });
      } finally {
        setBusy(false);
      }
    },
    [detalle, motivo, notifyClient, reportRowId, reloadOrders]
  );

  const openHistory = useCallback((row: Row) => {
    setHistoryOrderId(row.id);
    setHistoryTechnicians(row.technicians ?? []);
    setHistoryOpen(true);
  }, []);

  const closeHistory = useCallback(() => {
    setHistoryOpen(false);
    setHistoryOrderId(null);
    setHistoryTechnicians([]);
  }, []);

  const printRow = useCallback((row: Row) => {
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
        ? `<tr><td colspan="4" class="empty">—</td></tr>`
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
        ? `<tr><td colspan="4" class="empty">—</td></tr>`
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
<div class="label" style="margin-bottom:6px">Garantía</div>
<div class="grid">
  <div class="item"><div class="label">Estado</div><div class="val">${
    estadoKey === "GarantiaReportada" ? "Garantía (reportada)" : "Garantía"
  }</div></div>
  <div class="item"><div class="label">Motivo</div><div class="val">${escapeHtml(row.garantia.label)}</div></div>
  <div class="item"><div class="label">Reportado por</div><div class="val">${escapeHtml(row.garantia.reportedBy)}</div></div>
  <div class="item"><div class="label">Fecha reporte</div><div class="val">${escapeHtml(
    formatDateTimeES(row.garantia.reportedAtISO)
  )}</div></div>
  <div class="item" style="grid-column:1 / -1"><div class="label">Detalle</div><div class="val">${
    row.garantia.details ? nl2br(escapeHtml(row.garantia.details)) : "—"
  }</div></div>
  <div class="item" style="grid-column:1 / -1"><div class="label">Cliente notificado</div><div class="val">${
    typeof row.garantia.notifiedClient === "boolean" ? (row.garantia.notifiedClient ? "Sí" : "No") : "—"
  }</div></div>
</div>
</div>`
      : "";

    const files = row.files ?? [];
    const filesBlock =
      files.length === 0
        ? `<div class="item" style="grid-column:1 / -1"><div class="label">Archivos</div><div class="val">—</div></div>`
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
      <div class="sub">Código: <span class="mono">OS-${String(row.id).padStart(6, "0")}</span></div>
    </div>
    <div class="badge"><span class="dot"></span><span style="font-weight:700">Vertecx</span></div>
  </div>

  <div class="grid">
    <div class="item"><div class="label">Estado</div><div class="val">${escapeHtml(
      estadoKey === "GarantiaReportada" ? "Garantía (reportada)" : row.estado
    )}</div></div>

    <div class="item"><div class="label">Tipo</div><div class="val">${escapeHtml(row.tipo)}</div></div>

    <div class="item"><div class="label">Cliente</div><div class="val">${escapeHtml(row.cliente)}</div></div>

    <div class="item"><div class="label">Técnicos</div><div class="val">${escapeHtml(row.tecnico || "—")}</div></div>

    <div class="item"><div class="label">Fecha inicio</div><div class="val">${escapeHtml(formatDateES(row.fechainicio) || "—")}</div></div>

    <div class="item"><div class="label">Fecha fin</div><div class="val">${escapeHtml(formatDateES(row.fechafin) || "—")}</div></div>

    <div class="item"><div class="label">Hora inicio</div><div class="val">${escapeHtml(formatTimeES(row.horainicio) || "—")}</div></div>

    <div class="item"><div class="label">Hora fin</div><div class="val">${escapeHtml(formatTimeES(row.horafin) || "—")}</div></div>

    <div class="item"><div class="label">Fecha programada</div><div class="val">${escapeHtml(row.fechaProgramada || "—")}</div></div>

    <div class="item"><div class="label">Viáticos</div><div class="val">${escapeHtml(formatCOP(viaticos))}</div></div>

    <div class="item"><div class="label">Total (registrado)</div><div class="val"><b>${escapeHtml(
      formatCOP(totalRegistrado)
    )}</b></div></div>

    <div class="item"><div class="label">Creada</div><div class="val">${escapeHtml(formatDateTimeES(row.createdat) || "—")}</div></div>

    <div class="item"><div class="label">Actualizada</div><div class="val">${escapeHtml(formatDateTimeES(row.updatedat) || "—")}</div></div>

    <div class="item" style="grid-column:1 / -1">
      <div class="label">Descripción</div>
      <div class="val">${row.descripcion ? nl2br(escapeHtml(row.descripcion)) : "—"}</div>
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
    <div class="label" style="margin-bottom:6px">Totales (IVA desde subtotal con viáticos)</div>
    <div class="tot">
      <div class="row"><span>Subtotal servicios</span><span>${escapeHtml(formatCOP(subServ))}</span></div>
      <div class="row"><span>Subtotal materiales</span><span>${escapeHtml(formatCOP(subMat))}</span></div>
      <div class="row"><span>Viáticos</span><span>${escapeHtml(formatCOP(viaticos))}</span></div>
      <div class="row"><span>Subtotal (base IVA)</span><span>${escapeHtml(formatCOP(subtotalBaseIVA))}</span></div>
      <div class="row"><span>IVA (${IVA_PCT}%)</span><span>${escapeHtml(formatCOP(iva))}</span></div>
      <div class="row b"><span>Total calculado</span><span>${escapeHtml(formatCOP(totalCalculado))}</span></div>
    </div>
    <div class="note">El IVA se calcula sobre el subtotal (servicios + materiales + viáticos).</div>
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
    <span class="muted">Módulo: ${escapeHtml(MODULE_KEY)}</span>
  </div>
</div>
</body></html>`;

    const iframe: HTMLIFrameElement = document.createElement("iframe");
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
  }, []);

  const downloadReport = useCallback(async () => {
    if (loading) return;

    const mod = await import("exceljs");
    const ExcelJS: any = (mod as any).default ?? mod;

    const wb = new ExcelJS.Workbook();
    wb.creator = "Vertecx";
    wb.created = new Date();

    const ws = wb.addWorksheet("Órdenes de servicio");
    ws.columns = [
      { header: "Id", key: "id", width: 8 },
      { header: "Cliente", key: "cliente", width: 28 },
      { header: "Tipo", key: "tipo", width: 16 },
      { header: "Fecha programada", key: "fechaProgramada", width: 18 },
      { header: "Estado", key: "estado", width: 18 },
      { header: "Viáticos (COP)", key: "viaticos", width: 16, style: { numFmt: '"$" #,##0' } },
      { header: "Monto (COP)", key: "monto", width: 16, style: { numFmt: '"$" #,##0' } },
    ];

    sortRowsByIdDesc(rows).forEach((r) => {
      const estadoKey = r.estadoKey ?? r.estado;
      ws.addRow({
        id: r.id,
        cliente: r.cliente,
        tipo: r.tipo,
        fechaProgramada: r.fechaProgramada,
        estado: estadoKey === "GarantiaReportada" ? "Garantía (reportada)" : r.estado,
        viaticos: r.viaticos ?? 0,
        monto: r.monto ?? 0,
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_ordenes.xlsx";
    document.body.appendChild(a);
    a.click?.();
    a.remove?.();
    URL.revokeObjectURL(url);
  }, [rows, loading]);

  const actionGuard = useCallback((r: Row) => {
    const estadoKey = r.estadoKey ?? r.estado;
    if (estadoKey === "Anulada") {
      return {
        disableEdit: true,
        disableDelete: true,
        disableCancel: true,
        editTitle: "No se puede editar una orden anulada",
        deleteTitle: "La orden ya está anulada",
        cancelTitle: "La orden ya está anulada",
      };
    }
    return {};
  }, []);

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "id", header: "ID", render: (r) => <span>#{r.id}</span> },
      { key: "cliente", header: "Cliente" },
      { key: "tipo", header: "Tipo" },
      { key: "fechaProgramada", header: "Fecha" },
      {
        key: "estado",
        header: "Estado",
        render: (r) => {
          const estadoKey = r.estadoKey ?? r.estado;
          if (estadoKey === "GarantiaReportada") {
            const fecha = r.garantia?.reportedAtISO
              ? new Date(r.garantia.reportedAtISO).toLocaleDateString("es-CO")
              : "";
            const title = r.garantia
              ? `Motivo: ${r.garantia.label} · Reportado por: ${r.garantia.reportedBy}${fecha ? " · " + fecha : ""}`
              : "Garantía (reportada)";
            return (
              <span className="inline-flex items-center gap-2" title={title}>
                <img src={ICONS.report} className="h-4 w-4" alt="" />
                <EstadoText v={r.estado} colorKey={estadoKey} />
              </span>
            );
          }
          if (estadoKey === "Garantia") {
            return (
              <span className="inline-flex items-center gap-2" title="Garantía sin reporte">
                <img src={ICONS.report} className="h-4 w-4" alt="" />
                <EstadoText v={r.estado} colorKey={estadoKey} />
              </span>
            );
          }
          return <EstadoText v={r.estado} colorKey={estadoKey} />;
        },
      },
      { key: "monto", header: "Monto", render: (r) => <b>{formatCOP(r.monto)}</b> },
    ],
    []
  );

const extraActions = useCallback(
  (r: Row) => {
    const estadoKey = r.estadoKey ?? r.estado;
    const disableWarranty = estadoKey === "Anulada";
    const disableHistory = estadoKey === "Anulada";

      const baseBtn =
        "p-1 rounded-full transition-all duration-300 hover:scale-110 hover:bg-red-300/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent";

    const warrantyTitle =
      estadoKey === "Garantia" || estadoKey === "GarantiaReportada"
        ? estadoKey === "Garantia"
          ? "Completar reporte de garantía"
          : "Editar reporte de garantía"
        : "Marcar garantía (sin reporte)";

      return (
        <>
          <button
            type="button"
            className={baseBtn}
            title={disableHistory ? "No disponible en una orden anulada" : "Agregar historial"}
            onClick={() => openHistory(r)}
            disabled={disableHistory}
          >
            <FilePlus2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            className={baseBtn}
            title={disableWarranty ? "No disponible en una orden anulada" : warrantyTitle}
            onClick={() => {
              if (disableWarranty) return;
              if (estadoKey === "Garantia" || estadoKey === "GarantiaReportada") openReport(r);
              else markWarranty(r);
            }}
            disabled={disableWarranty}
          >
            <img src={ICONS.report} className="h-4 w-4" alt="" />
          </button>

          <button type="button" className={baseBtn} title="Imprimir" onClick={() => printRow(r)}>
            <img src={ICONS.print} className="h-4 w-4" alt="" />
          </button>
        </>
      );
    },
    [markWarranty, openReport, printRow, openHistory]
  );

  const rightActions = useMemo(() => {
    return (
      <button
        type="button"
        onClick={downloadReport}
        disabled={loading}
        className="cursor-pointer inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: Colors.buttons.primary }}
      >
        Descargar Reporte
      </button>
    );
  }, [downloadReport, loading]);

  return (
    <RequireAuth>
      {loading || busy ? <Loader /> : null}

      <div className="flex">
        <div className="flex-1 flex flex-col">
          <main className="flex-1 flex flex-col">
            <div className="px-6 pt-6 pb-6">
              <DataTable<Row>
                module={MODULE_KEY}
                data={Array.isArray(rows) ? rows : []}
                columns={columns}
                pageSize={8}
                searchableKeys={["id", "cliente", "tecnico", "tipo", "fechaProgramada", "estado", "monto", "descripcion"]}
                searchPlaceholder="Buscar (id, cliente, tipo, estado, fecha, monto, descripción)…"
                rightActions={rightActions}
                onCreate={openCreate}
                createButtonText="Crear Orden"
                onView={openDetail}
                onEdit={openEdit}
                onCancel={cancelRow}
                actionGuard={actionGuard}
                renderExtraActions={extraActions}
                mobileCardView
                disableInternalScroll
              />
            </div>
          </main>
        </div>
      </div>

      <OrderServiceHistoryCreateModal
        isOpen={historyOpen}
        onClose={closeHistory}
        orderId={historyOrderId}
        technicians={historyTechnicians}
        onCreated={reloadOrders}
      />

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
            <input type="checkbox" checked={notifyClient} onChange={(e) => setNotifyClient(e.target.checked)} />
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
