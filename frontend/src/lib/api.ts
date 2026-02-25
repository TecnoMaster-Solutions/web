import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

type TokensResponse = { access_token: string; refresh_token: string };

const ACCESS_COOKIE_KEY = "token";
const REFRESH_COOKIE_KEY = "refresh";

function cookieOptions() {
  return { path: "/", sameSite: "lax" as const };
}

let accessToken: string | null =
  typeof window !== "undefined"
    ? localStorage.getItem("accessToken") ?? Cookies.get(ACCESS_COOKIE_KEY) ?? null
    : null;

let refreshTokenValue: string | null =
  typeof window !== "undefined"
    ? localStorage.getItem("refreshToken") ?? Cookies.get(REFRESH_COOKIE_KEY) ?? null
    : null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("accessToken", token);
    Cookies.set(ACCESS_COOKIE_KEY, token, cookieOptions());
  } else {
    localStorage.removeItem("accessToken");
    Cookies.remove(ACCESS_COOKIE_KEY, { path: "/" });
  }
}

export function setRefreshToken(token: string | null) {
  refreshTokenValue = token;
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("refreshToken", token);
    Cookies.set(REFRESH_COOKIE_KEY, token, cookieOptions());
  } else {
    localStorage.removeItem("refreshToken");
    Cookies.remove(REFRESH_COOKIE_KEY, { path: "/" });
  }
}

export function setTokens(tokens: { access_token: string; refresh_token: string }) {
  setAccessToken(tokens.access_token);
  setRefreshToken(tokens.refresh_token);
}

export function clearTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshTokenValue;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers = (config.headers ?? new AxiosHeaders()) as AxiosHeaders;
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  config.headers = headers;
  return config;
});

let isRefreshing = false;
let queue: Array<(t: string | null) => void> = [];

async function refreshAccessToken(): Promise<string> {
  const rt = getRefreshToken();
  if (!rt) throw new Error("NO_REFRESH_TOKEN");

  const { data } = await axios.post<TokensResponse>(
    `${API_URL}auth/refresh`,
    { refresh_token: rt },
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );

  setTokens(data);
  return data.access_token;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean });

    if (error?.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      const newTok = await new Promise<string | null>((resolve) => queue.push(resolve));
      if (!newTok) return Promise.reject(error);

      const headers = (original.headers ?? new AxiosHeaders()) as AxiosHeaders;
      headers.set("Authorization", `Bearer ${newTok}`);
      original.headers = headers;

      return api(original);
    }

    try {
      isRefreshing = true;

      const newTok = await refreshAccessToken();

      queue.forEach((fn) => fn(newTok));
      queue = [];

      const headers = (original.headers ?? new AxiosHeaders()) as AxiosHeaders;
      headers.set("Authorization", `Bearer ${newTok}`);
      original.headers = headers;

      return api(original);
    } catch (e) {
      clearTokens();
      queue.forEach((fn) => fn(null));
      queue = [];
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);
