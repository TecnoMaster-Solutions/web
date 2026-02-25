"use client";

import { SERVICE_TYPE_FILTERS } from "../types/calendar.constants";
import type { AppointmentFilterOption } from "../hooks/useAppointmentFilters";

export type AppointmentFiltersProps = {
  eventsLength: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  showClientFilter: boolean;
  stateOptions: AppointmentFilterOption[];
  technicianOptions: AppointmentFilterOption[];
  clientOptions: AppointmentFilterOption[];
  sourceFilter: string;
  stateFilter: string;
  searchTerm: string;
  serviceTypeFilter: string;
  technicianFilter: string;
  clientFilter: string;
  onSourceChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onServiceTypeChange: (value: string) => void;
  onTechnicianChange: (value: string) => void;
  onClientChange: (value: string) => void;
  onClearFilters: () => void;
};

const baseSelectClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-black focus:bg-white focus:outline-none";

const AppointmentFilters = ({
  eventsLength,
  filteredCount,
  hasActiveFilters,
  showClientFilter,
  clientOptions,
  technicianOptions,
  stateOptions,
  sourceFilter,
  stateFilter,
  searchTerm,
  serviceTypeFilter,
  technicianFilter,
  clientFilter,
  onSourceChange,
  onStateChange,
  onSearchChange,
  onServiceTypeChange,
  onTechnicianChange,
  onClientChange,
  onClearFilters,
}: AppointmentFiltersProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">Filtros de citas</p>
        <p className="text-xs text-slate-500">
          Mostrando {filteredCount} de {eventsLength} citas.
        </p>
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
        >
          Limpiar filtros
        </button>
      )}
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Tipo de evento
        <select value={sourceFilter} onChange={(e) => onSourceChange(e.target.value)} className={baseSelectClass}>
          <option value="all">Todas las citas</option>
          <option value="order">Órdenes de servicio</option>
          <option value="request">Solicitudes de servicio</option>
        </select>
      </label>
      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Estado
        <select value={stateFilter} onChange={(e) => onStateChange(e.target.value)} className={baseSelectClass}>
          <option value="all">Todos los estados</option>
          {stateOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Buscar
        <input
          type="search"
          placeholder="Cliente, código o estado"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-black focus:bg-white focus:outline-none"
        />
      </label>
    </div>

    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Tipo de servicio
        <select
          value={serviceTypeFilter}
          onChange={(e) => onServiceTypeChange(e.target.value)}
          className={baseSelectClass}
        >
          <option value="all">Todos los tipos</option>
          {SERVICE_TYPE_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-xs font-semibold text-slate-500">
        Técnico asignado
        <select
          value={technicianFilter}
          onChange={(e) => onTechnicianChange(e.target.value)}
          className={baseSelectClass}
        >
          <option value="all">Todos los técnicos</option>
          {technicianOptions.map((item) => (
            <option key={item.value} value={String(item.value)}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {showClientFilter && (
        <label className="space-y-1 text-xs font-semibold text-slate-500">
          Cliente
          <select value={clientFilter} onChange={(e) => onClientChange(e.target.value)} className={baseSelectClass}>
            <option value="all">Todos los clientes</option>
            {clientOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  </div>
);

export default AppointmentFilters;
