import axios, { type AxiosRequestConfig } from "axios";

const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: DEFAULT_API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RequestOptions = AxiosRequestConfig;

export const apiClient = {
  async get<T>(path: string, config?: RequestOptions): Promise<T> {
    const res = await api.get<T>(path, config);
    return res.data;
  },

  async post<T>(
    path: string,
    body?: unknown,
    config?: RequestOptions
  ): Promise<T> {
    const res = await api.post<T>(path, body, config);
    return res.data;
  },

  async patch<T>(
    path: string,
    body?: unknown,
    config?: RequestOptions
  ): Promise<T> {
    const res = await api.patch<T>(path, body, config);
    return res.data;
  },

  async delete<T>(path: string, config?: RequestOptions): Promise<T> {
    const res = await api.delete<T>(path, config);
    return res.data;
  },
};