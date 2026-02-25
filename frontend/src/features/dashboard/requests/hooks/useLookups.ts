import { useQuery } from "@tanstack/react-query";
import type { Option } from "@/features/dashboard/requests/types/option.types";
import { getServiceOptions, getCustomerOptions } from "@/features/dashboard/requests/services/lookups.service";

export type ServiceOption = Option & {
  typeofserviceid?: number | null;
  typeofservicename?: string | null;
  serviceTypeCode?: string | null;
};

export function useLookups() {
  const servicesQ = useQuery({
    queryKey: ["lookups", "services"],
    queryFn: async () => {
      const arr = await getServiceOptions();
      return Array.isArray(arr) ? (arr as ServiceOption[]) : [];
    },
  });

  const customersQ = useQuery({
    queryKey: ["lookups", "customers"],
    queryFn: async () => {
      const arr = await getCustomerOptions();
      return Array.isArray(arr) ? (arr as Option[]) : [];
    },
  });

  return {
    serviceOptions: servicesQ.data ?? [],
    customerOptions: customersQ.data ?? [],
    isLoading: servicesQ.isLoading || customersQ.isLoading,
  };
}
