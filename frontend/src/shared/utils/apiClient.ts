import { type AxiosRequestConfig } from "axios";
import { api } from "@/lib/api";

type RequestOptions = AxiosRequestConfig;

export { api };

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
