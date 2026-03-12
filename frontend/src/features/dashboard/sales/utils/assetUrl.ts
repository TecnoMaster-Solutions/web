import { getPublicRuntimeConfig } from "@/lib/runtime-config";

export function resolveAssetUrl(url?: string | null) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const apiBase = getPublicRuntimeConfig().apiUrl;
  const normalizedBase = apiBase.replace(/\/+$/, "");
  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;

  return `${normalizedBase}${normalizedPath}`;
}
