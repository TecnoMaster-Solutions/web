const DEFAULT_API_URL = "http://localhost:3001";
const DEFAULT_APP_URL = "http://localhost:3000";

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

  return {
    apiUrl: normalizeUrl(
      runtimeConfig?.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
      DEFAULT_API_URL
    ),
    appUrl: normalizeUrl(
      runtimeConfig?.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL,
      DEFAULT_APP_URL
    ),
  };
}
