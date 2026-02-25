type TimeWindow = {
  startMs: number;
  endMs: number;
};

type BusyOptions = {
  excludeOrderId?: number | null;
  excludeRequestId?: number | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isCanceledState(stateName: unknown) {
  const name = normalizeText(stateName);
  return name.includes("anul") || name.includes("cancel");
}

function parseLocalDateTimeToMs(dateRaw: unknown, timeRaw: unknown) {
  const date = String(dateRaw ?? "").trim();
  const time = String(timeRaw ?? "").trim().slice(0, 5);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const y = Number(dateMatch[1]);
  const m = Number(dateMatch[2]);
  const d = Number(dateMatch[3]);
  const hh = Number(timeMatch[1]);
  const mm = Number(timeMatch[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  const ts = dt.getTime();
  return Number.isFinite(ts) ? ts : null;
}

function parseIsoToMs(value: unknown) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const dt = new Date(s);
  const ts = dt.getTime();
  return Number.isFinite(ts) ? ts : null;
}

function normalizeRange(startMs: number | null, endMs: number | null): TimeWindow | null {
  if (!Number.isFinite(startMs)) return null;
  const safeEnd =
    Number.isFinite(endMs) && (endMs as number) > (startMs as number)
      ? (endMs as number)
      : (startMs as number) + 60 * 60 * 1000;
  return { startMs: startMs as number, endMs: safeEnd };
}

function rangesOverlap(a: TimeWindow, b: TimeWindow) {
  return Math.max(a.startMs, b.startMs) < Math.min(a.endMs, b.endMs);
}

function readNested(obj: unknown, ...keys: string[]) {
  let curr: unknown = obj;
  for (const key of keys) {
    const rec = asRecord(curr);
    if (!rec) return undefined;
    curr = rec[key];
  }
  return curr;
}

function extractOrderTechnicianIds(order: unknown): number[] {
  const rec = asRecord(order);
  const source = rec?.technicians;
  const list = Array.isArray(source) ? source : [];

  const ids = list
    .map((entry) => {
      const row = asRecord(entry);
      return toNumber(
        row?.technicianid ?? row?.technicianId ?? row?.id ?? entry
      );
    })
    .filter((id): id is number => id != null && id > 0);

  return Array.from(new Set(ids));
}

function extractRequestTechnicianIds(request: unknown): number[] {
  const rec = asRecord(request);
  const buckets = [
    ...(Array.isArray(rec?.technicians) ? rec.technicians : []),
    ...(Array.isArray(rec?.assignedTechnicians) ? rec.assignedTechnicians : []),
    ...(Array.isArray(rec?.serviceRequestTechnicians) ? rec.serviceRequestTechnicians : []),
    ...(Array.isArray(rec?.requestTechnicians) ? rec.requestTechnicians : []),
    ...(Array.isArray(rec?.techniciansMap) ? rec.techniciansMap : []),
  ];

  const ids = buckets
    .map((entry) => {
      const row = asRecord(entry);
      return toNumber(
        row?.technicianid ??
          row?.technicianId ??
          row?.id ??
          readNested(row, "technician", "technicianid") ??
          readNested(row, "technician", "technicianId") ??
          readNested(row, "technician", "id")
      );
    })
    .filter((id): id is number => id != null && id > 0);

  return Array.from(new Set(ids));
}

function getOrderRange(order: unknown): TimeWindow | null {
  const rec = asRecord(order);
  const stateName = readNested(rec, "state", "name") ?? rec?.statename ?? rec?.state;
  if (isCanceledState(stateName)) return null;

  const startMs = parseLocalDateTimeToMs(rec?.fechainicio, rec?.horainicio);
  const endMs = parseLocalDateTimeToMs(rec?.fechafin ?? rec?.fechainicio, rec?.horafin);
  return normalizeRange(startMs, endMs);
}

function getRequestRange(request: unknown): TimeWindow | null {
  const rec = asRecord(request);
  const stateName = readNested(rec, "state", "name") ?? rec?.statename ?? rec?.state;
  if (isCanceledState(stateName)) return null;

  const startMs = parseIsoToMs(rec?.scheduledAt ?? rec?.scheduledat);
  const endMs = parseIsoToMs(rec?.scheduledEndAt ?? rec?.scheduledendat);
  return normalizeRange(startMs, endMs);
}

export function buildWindowFromLocalSchedule(
  startDate: string | null | undefined,
  startTime: string | null | undefined,
  endDate: string | null | undefined,
  endTime: string | null | undefined
) {
  const startMs = parseLocalDateTimeToMs(startDate, startTime);
  const endMs = parseLocalDateTimeToMs(endDate ?? startDate, endTime);
  return normalizeRange(startMs, endMs);
}

export function getBusyTechnicianIdsForWindow(
  orders: unknown[],
  requests: unknown[],
  window: TimeWindow | null,
  options: BusyOptions = {}
) {
  if (!window) return new Set<number>();

  const busy = new Set<number>();

  for (const order of Array.isArray(orders) ? orders : []) {
    const rec = asRecord(order);
    const orderId = toNumber(rec?.ordersservicesid ?? rec?.id);
    if (options.excludeOrderId && orderId === options.excludeOrderId) continue;

    const orderWindow = getOrderRange(order);
    if (!orderWindow || !rangesOverlap(window, orderWindow)) continue;
    for (const id of extractOrderTechnicianIds(order)) busy.add(id);
  }

  for (const request of Array.isArray(requests) ? requests : []) {
    const rec = asRecord(request);
    const requestId = toNumber(rec?.serviceRequestId ?? rec?.servicerequestid ?? rec?.id);
    if (options.excludeRequestId && requestId === options.excludeRequestId) continue;

    const requestWindow = getRequestRange(request);
    if (!requestWindow || !rangesOverlap(window, requestWindow)) continue;
    for (const id of extractRequestTechnicianIds(request)) busy.add(id);
  }

  return busy;
}
