const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/;
const ALLOWED_REQUEST_TEXT_REGEX = /^[\p{L}\p{N}\s.,;:()\-#@/&+*'"%!?¿¡°]+$/u;

export function hasInvalidRequestCharacters(value: string) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  if (CONTROL_CHARS_REGEX.test(text)) return true;
  return !ALLOWED_REQUEST_TEXT_REGEX.test(text);
}
