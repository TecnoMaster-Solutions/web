import { fetchOrdersServicesByDateRange } from "@/features/dashboard/OrdersServices/api/ordersServices.api";
import { fetchOrdersServices } from "@/features/dashboard/OrdersServices/api/ordersServices.api";
import {
  listServiceRequests,
  listServiceRequestsByDateRange,
} from "@/features/dashboard/requests/services/servicerequests.service";

type RequestOptions = { signal?: AbortSignal };

const formatYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildMonthRange = (baseDate: Date) => {
  const from = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const to = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return {
    from: formatYmd(from),
    to: formatYmd(to),
  };
};

export const fetchAppointmentSources = async (
  monthDate: Date,
  search?: string,
  options?: RequestOptions
) => {
  const { from, to } = buildMonthRange(monthDate);
  const trimmedSearch = search?.trim();
  const [orders, requests] = trimmedSearch
    ? await Promise.all([
        fetchOrdersServices(trimmedSearch, { signal: options?.signal }),
        listServiceRequests(trimmedSearch, { signal: options?.signal }),
      ])
    : await Promise.all([
        fetchOrdersServicesByDateRange(from, to, undefined, { signal: options?.signal }),
        listServiceRequestsByDateRange(from, to, undefined, { signal: options?.signal }),
      ]);

  return { orders, requests };
};

export const fetchAllAppointmentSources = async (search?: string, options?: RequestOptions) => {
  const trimmedSearch = search?.trim();
  const [orders, requests] = await Promise.all([
    fetchOrdersServices(trimmedSearch, { signal: options?.signal }),
    listServiceRequests(trimmedSearch, { signal: options?.signal }),
  ]);

  return { orders, requests };
};
