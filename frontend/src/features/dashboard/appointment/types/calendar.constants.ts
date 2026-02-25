// types/calendar.constants.ts
import { appointmentStatePalette } from "../helpers/appointmentState.helpers";
import type { ServiceTypeFilterKey } from "../helpers/appointment.helpers";

export const CALENDAR_MESSAGES = {
  allDay: "Todo el día",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "No hay citas en este rango.",
};

export const upcomingFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const calendarMinTime = (() => {
  const d = new Date();
  d.setHours(7, 0, 0, 0);
  return d;
})();

export const calendarMaxTime = (() => {
  const d = new Date();
  d.setHours(17, 0, 0, 0);
  return d;
})();

export const LEGEND_ITEMS = [
  { label: "Orden de servicio", description: "Eventos confirmados o activos", color: "#2B2B2B" },
  { label: "Solicitud de servicio", description: "Eventos iniciados desde solicitudes", color: "#F5F5F0" },
];

export const STATE_LEGEND_ITEMS = [
  { label: "Pendiente", palette: appointmentStatePalette.pendiente },
  { label: "Garantía", palette: appointmentStatePalette.garantia },
  { label: "Garantía reportada", palette: appointmentStatePalette.garantiareportada },
  { label: "Finalizado", palette: appointmentStatePalette.finalizado },
  { label: "Cancelado", palette: appointmentStatePalette.cancelado },
  { label: "En progreso", palette: appointmentStatePalette["en-progreso"] },
  { label: "Agendada", palette: appointmentStatePalette.agendado },
] as const;

export const SERVICE_TYPE_FILTERS: Array<{ value: ServiceTypeFilterKey; label: string }> = [
  { value: "preventivo", label: "Mantenimiento preventivo" },
  { value: "correctivo", label: "Mantenimiento correctivo" },
  { value: "instalacion", label: "Instalación" },
];
