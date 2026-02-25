import { fetchOrdersServices } from "@/features/dashboard/OrdersServices/api/ordersServices.api";
import { listServiceRequests } from "@/features/dashboard/requests/services/servicerequests.service";

export const fetchAppointmentSources = async () => {
  const [orders, requests] = await Promise.all([
    fetchOrdersServices(),
    listServiceRequests(),
  ]);

  return { orders, requests };
};
