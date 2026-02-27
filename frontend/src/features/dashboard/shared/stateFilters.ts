function normalizeStateName(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

const REQUEST_STATE_TOKENS = ["pend", "agend", "aprob", "anul", "cancel", "final", "complet", "proceso"];
const ORDER_STATE_TOKENS = [...REQUEST_STATE_TOKENS, "garan", "warranty"];

export function isServiceRequestStateLike(stateName: unknown) {
  const normalized = normalizeStateName(stateName);
  return normalized.length > 0 && includesAny(normalized, REQUEST_STATE_TOKENS);
}

export function isOrderServiceStateLike(stateName: unknown) {
  const normalized = normalizeStateName(stateName);
  return normalized.length > 0 && includesAny(normalized, ORDER_STATE_TOKENS);
}
