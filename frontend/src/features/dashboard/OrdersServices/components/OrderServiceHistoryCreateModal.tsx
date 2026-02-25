"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import { addOrderServiceWorklog, fetchOrderServiceHistory } from "@/features/dashboard/OrdersServices/api/ordersServices.api";
import { showError, showSuccess, showWarning } from "@/shared/utils/notifications";
import { RefreshCw } from "lucide-react";

type TechnicianOption = { technicianid: number; label: string };
type HistoryType = "TECH" | "SYSTEM";

type HistoryItem = {
  ordersserviceshistoryid?: number;
  type?: string;
  message?: string;
  createdat?: string;
};

type AddWorklogPayload = {
  technicianid: number;
  note: string;
  title?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  technicians?: TechnicianOption[];
  defaultType?: HistoryType;
  onCreated?: () => void;
  widthClass?: string;
};

function safeDateTime(v?: string) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-CO");
}

export default function OrderServiceHistoryCreateModal({
  isOpen,
  onClose,
  orderId,
  technicians = [],
  defaultType = "TECH",
  onCreated,
  widthClass = "md:max-w-2xl",
}: Props) {
  const hasTechOptions = technicians.length > 0;

  const defaultTechId = useMemo(
    () => technicians[0]?.technicianid ?? 0,
    [technicians]
  );

  const [technicianid, setTechnicianid] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const [type, setType] = useState<HistoryType>(defaultType);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errTech, setErrTech] = useState("");
  const [errNote, setErrNote] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTechnicianid(defaultTechId || 0);
    setTitle("");
    setNote("");
    setErrTech("");
    setErrNote("");
    setType(defaultType);
  }, [isOpen, defaultTechId, defaultType]);

  async function loadHistory() {
    if (!orderId) return;
    setHistoryLoading(true);
    try {
      const data = await fetchOrderServiceHistory(orderId, type);
      setHistory(Array.isArray(data) ? (data as any) : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    if (!orderId) return;
    loadHistory();
  }, [isOpen, orderId, type]);

  async function onSubmit() {
    const techId = Number(technicianid) || 0;
    const t = title.trim();
    const n = note.trim();

    let ok = true;

    if (!techId || techId < 1) {
      setErrTech("Selecciona o ingresa un técnico");
      ok = false;
    } else {
      setErrTech("");
    }

    if (!n) {
      setErrNote("Escribe una nota");
      ok = false;
    } else if (n.length > 2000) {
      setErrNote("La nota supera 2000 caracteres");
      ok = false;
    } else {
      setErrNote("");
    }

    if (t.length > 120) {
      showWarning("El título supera 120 caracteres.");
      ok = false;
    }

    if (!ok) return;

    if (!orderId) {
      showError("No se encontró el ID de la orden.");
      return;
    }

    setSaving(true);
    try {
      const dto: AddWorklogPayload = t
        ? { technicianid: techId, note: n, title: t }
        : { technicianid: techId, note: n };

      await addOrderServiceWorklog(orderId, dto as any);
      showSuccess("Historial registrado");
      setTitle("");
      setNote("");
      onCreated?.();
      await loadHistory();
    } catch {
      showError("No se pudo guardar el historial");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={orderId ? `Agregar historial · Orden #${orderId}` : "Agregar historial"}
      isOpen={isOpen}
      onClose={onClose}
      widthClass={widthClass}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving || !orderId}
            className="cursor-pointer inline-flex h-9 items-center rounded-md bg-[#B20000] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Guardar historial"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">Técnico</label>
            {hasTechOptions ? (
              <select
                value={technicianid ? String(technicianid) : ""}
                onChange={(e) => {
                  setTechnicianid(Number(e.target.value) || 0);
                  setErrTech("");
                }}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${
                  errTech ? "border-red-500 focus:ring-red-200" : "focus:ring-[#B20000]/30"
                }`}
              >
                {technicians.map((t) => (
                  <option key={t.technicianid} value={t.technicianid}>
                    {t.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                min={1}
                value={technicianid ? String(technicianid) : ""}
                onChange={(e) => {
                  setTechnicianid(Number(e.target.value) || 0);
                  setErrTech("");
                }}
                placeholder="ID del técnico"
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${
                  errTech ? "border-red-500 focus:ring-red-200" : "focus:ring-[#B20000]/30"
                }`}
              />
            )}
            {errTech ? <p className="text-xs text-red-600 mt-1">{errTech}</p> : null}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">Título (opcional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Ej: Avance de instalación"
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#B20000]/30"
            />
            <div className="text-[11px] text-gray-500 mt-1">{title.length}/120</div>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-600 mb-1">Nota</label>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (e.target.value.trim()) setErrNote("");
            }}
            rows={4}
            maxLength={2000}
            placeholder="Describe lo realizado, hallazgos, recomendaciones, etc."
            className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${
              errNote ? "border-red-500 focus:ring-red-200" : "focus:ring-[#B20000]/30"
            }`}
          />
          <div className="flex items-center justify-between mt-1">
            {errNote ? <p className="text-xs text-red-600">{errNote}</p> : <span />}
            <span className="text-[11px] text-gray-500">{note.length}/2000</span>
          </div>
        </div>

        <div className="rounded-lg border bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-sm font-semibold text-gray-800">Historial reciente</div>
            <div className="flex items-center gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as HistoryType)}
                className="border rounded-md px-2 py-1 text-sm outline-none"
              >
                <option value="TECH">TECH</option>
                <option value="SYSTEM">SYSTEM</option>
              </select>

              <button
                type="button"
                onClick={loadHistory}
                disabled={!orderId || historyLoading}
                className="inline-flex items-center gap-2 border rounded-md px-2 py-1 text-sm hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-4 w-4" />
                Refrescar
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div className="text-sm text-gray-600">Cargando historial...</div>
          ) : history.length ? (
            <div className="space-y-2 max-h-56 overflow-auto pr-1">
              {history.slice(0, 10).map((h, idx) => (
                <div
                  key={h.ordersserviceshistoryid ?? `${h.createdat ?? ""}-${idx}`}
                  className="rounded-md bg-white border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-gray-700">{h.type ?? type}</div>
                    <div className="text-[11px] text-gray-500">{safeDateTime(h.createdat)}</div>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1">
                    {h.message ?? ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">Sin registros para el filtro actual.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
