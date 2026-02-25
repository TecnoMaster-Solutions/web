export type SplitDateTime = {
  date: string | null;
  time: string | null;
};

export function toLocalDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toLocalTimeInputValue(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function toLocalDateTimeValue(d: Date): string {
  const date = toLocalDateInputValue(d);
  const time = toLocalTimeInputValue(d);
  return `${date}T${time}`;
}

export function splitDateTime(value: string | null): SplitDateTime {
  if (!value) return { date: null, time: null };
  const [date, timeFull] = value.split("T");
  const time = timeFull ? timeFull.slice(0, 5) : null;
  return {
    date: date || null,
    time: time || null,
  };
}

export function buildScheduledAt(
  date: string | null,
  time: string | null,
  fallback: Date | null
): string | null {
  if (!date && !time) return null;

  let base: Date;

  if (date) {
    const [y, m, d] = date.split("-").map((n) => Number(n));
    const [hh, mm] = (time || "00:00").split(":").map((n) => Number(n));
    base = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  } else if (fallback) {
    base = new Date(fallback);
    if (time) {
      const [hh, mm] = time.split(":").map((n) => Number(n));
      base.setHours(hh || 0, mm || 0, 0, 0);
    }
  } else {
    base = new Date();
  }

  return base.toISOString();
}
