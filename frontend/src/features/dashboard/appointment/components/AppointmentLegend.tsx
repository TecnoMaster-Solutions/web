"use client";

import { LEGEND_ITEMS, STATE_LEGEND_ITEMS } from "../types/calendar.constants";

export type AppointmentLegendProps = {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
};

const AppointmentLegend = ({ open, onClose, onToggle }: AppointmentLegendProps) => (
  <>
    {open && (
      <div
        className="fixed bottom-20 right-4 z-50 w-72 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl"
        role="dialog"
        aria-label="Leyenda de eventos"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Leyenda</p>
            <p className="text-xs text-slate-500">Colores según origen del evento</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {LEGEND_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2"
            >
              <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estados</p>
          <div className="mt-2 space-y-2">
            {STATE_LEGEND_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2"
              >
                <span
                  className="h-3 w-3 flex-shrink-0 rounded-full border"
                  style={{ backgroundColor: item.palette.background, borderColor: item.palette.border }}
                />
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    <button
      type="button"
      onClick={onToggle}
      className="fixed bottom-4 right-4 z-50 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
      aria-pressed={open}
      aria-label="Mostrar leyenda de eventos"
    >
      Leyenda
    </button>
  </>
);

export default AppointmentLegend;
