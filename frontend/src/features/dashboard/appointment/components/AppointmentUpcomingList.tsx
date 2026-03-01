"use client";

import type { AppointmentEvent } from "../types/typeAppointment";
import { upcomingFormatter } from "../types/calendar.constants";

export type AppointmentUpcomingListProps = {
  events: AppointmentEvent[];
  selectedEventKey: string | null;
  onSelect: (event: AppointmentEvent) => void;
};

const getAppointmentEventKey = (event: AppointmentEvent) =>
  `${event.source}-${event.id}`;

const AppointmentUpcomingList = ({
  events,
  selectedEventKey,
  onSelect,
}: AppointmentUpcomingListProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">Próximas citas</p>
        <p className="text-xs text-slate-500">Ordenadas por fecha de inicio</p>
      </div>
    </div>

    <div className="divide-y divide-slate-100">
      {events.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-500">
          No hay citas próximas registradas.
        </p>
      ) : (
        events.map((event) => (
          <button
            key={getAppointmentEventKey(event)}
            type="button"
            onClick={() => onSelect(event)}
            className={`w-full px-5 py-3 text-left transition hover:bg-slate-50 ${
              selectedEventKey === getAppointmentEventKey(event) ? "bg-slate-50" : ""
            }`}
          >
            <p className="text-sm font-semibold text-slate-900">{event.title}</p>
            <p className="text-xs text-slate-500">
              {upcomingFormatter.format(event.start)} · {event.clientLabel}
            </p>
          </button>
        ))
      )}
    </div>
  </div>
);

export default AppointmentUpcomingList;
