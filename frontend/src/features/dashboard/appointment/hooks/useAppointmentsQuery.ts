import { useQuery } from "@tanstack/react-query";
import { fetchAppointmentSources } from "../connection/appointmentsApi";


export const useAppointmentsQuery = () =>
  useQuery({
    queryKey: ["appointments", "orders-services-requests"],
    queryFn: fetchAppointmentSources,
  });
