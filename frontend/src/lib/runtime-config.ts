const DEFAULT_API_URL = "https://vertecx-api-sha-09ac69f.onrender.com";
const DEFAULT_APP_URL = "https://web-frontend-sha-2f5b9f5.onrender.com";

type RuntimeConfig = {
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
};

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

function normalizeUrl(value: string | undefined, fallback: string) {
  return (value ?? fallback).replace(/\/+$/, "");
}

export function getPublicRuntimeConfig() {
  const runtimeConfig =
    typeof window !== "undefined" ? window.__RUNTIME_CONFIG__ : undefined;
  const inferredBrowserOrigin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  return {
    apiUrl: normalizeUrl(
      runtimeConfig?.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
      DEFAULT_API_URL
    ),
    appUrl: normalizeUrl(
      runtimeConfig?.NEXT_PUBLIC_APP_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        inferredBrowserOrigin,
      DEFAULT_APP_URL
    ),
  };
}
