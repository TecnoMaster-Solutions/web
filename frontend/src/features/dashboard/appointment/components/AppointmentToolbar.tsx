"use client";

import type { NavigateAction, View } from "react-big-calendar";
import {
  Maximize,
  Minimize,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
} from "lucide-react";

export type AppointmentToolbarProps = {
  label: string;
  onNavigate: (action: NavigateAction) => void;
  onView: (view: View) => void;
  view: View;
  views?: View[];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onDownloadCalendar?: () => void;
  onDownloadExcel?: () => void;
  downloadDisabled?: boolean;
};

const viewLabels: Record<string, string> = {
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
};

export const AppointmentToolbar = ({
  label,
  onNavigate,
  onView,
  view,
  views = [],
  isFullscreen,
  onToggleFullscreen,
  onDownloadCalendar,
  onDownloadExcel,
  downloadDisabled = false,
}: AppointmentToolbarProps) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("PREV")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("TODAY")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("NEXT")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          aria-pressed={isFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="order-first shrink text-lg font-semibold text-slate-900 md:order-none">
        {label}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onDownloadCalendar && (
          <button
            type="button"
            onClick={onDownloadCalendar}
            disabled={downloadDisabled}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              downloadDisabled
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <Download className="h-4 w-4" />
            Descargar
          </button>
        )}
        {onDownloadExcel && (
          <button
            type="button"
            onClick={onDownloadExcel}
            disabled={downloadDisabled}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              downloadDisabled
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <FileDown className="h-4 w-4" />
            Excel
          </button>
        )}
        {views.map((viewName) => (
          <button
            key={viewName}
            type="button"
            onClick={() => onView(viewName)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              viewName === view
                ? "border-black bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {viewLabels[viewName] ?? viewName}
          </button>
        ))}
      </div>
    </div>
  );
};
