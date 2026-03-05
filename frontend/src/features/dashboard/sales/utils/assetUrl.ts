export function resolveAssetUrl(url?: string | null) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://vertecx-api-sha-09ac69f.onrender.com";
  const normalizedBase = apiBase.replace(/\/+$/, "");
  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;

  return `${normalizedBase}${normalizedPath}`;
}
