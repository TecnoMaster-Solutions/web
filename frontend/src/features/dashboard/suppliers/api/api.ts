import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";

const RAW = process.env.NEXT_PUBLIC_API_URL ?? "";
const API_URL = RAW.replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
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
let queue: Array<(t: string) => void> = [];

async function refreshToken(): Promise<string> {
  const { data } = await api.post("auth/refresh", {});
  const newAccess = data?.accessToken as string;
  setAccessToken(newAccess);
  return newAccess;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error?.response?.status === 401 && !original?._retry) {
      original._retry = true;
      if (isRefreshing) {
        const newTok = await new Promise<string>((resolve) => queue.push(resolve));
        const headers = (original.headers ?? new AxiosHeaders()) as AxiosHeaders;
        headers.set("Authorization", `Bearer ${newTok}`);
        original.headers = headers;
        return api(original);
      }
      try {
        isRefreshing = true;
        const newTok = await refreshToken();
        queue.forEach((fn) => fn(newTok));
        queue = [];
        const headers = (original.headers ?? new AxiosHeaders()) as AxiosHeaders;
        headers.set("Authorization", `Bearer ${newTok}`);
        original.headers = headers;
        return api(original);
      } catch (e) {
        setAccessToken(null);
        queue = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
