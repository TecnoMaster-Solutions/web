"use client";

import type { AppointmentEvent } from "../types/typeAppointment";
import { getEventTechnicians } from "./appointment.helpers";

export const techLabel = (event: AppointmentEvent) => {
  const technicians = getEventTechnicians(event).filter(Boolean);
  const names = technicians
    .map((tech) =>
      [tech?.users?.name, tech?.users?.lastname].filter(Boolean).join(" ").trim()
    )
    .filter(Boolean);

  if (names.length) return names.join(", ");
  if (technicians.length) return "Técnicos asignados";
  return "Sin técnicos asignados";
};
