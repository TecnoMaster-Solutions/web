"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, dateFnsLocalizer, type ToolbarProps } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarDays } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ToastContainer } from "react-toastify";

import AppointmentDetailModal from "./components/AppointmentDetailCard";
import AppointmentFilters from "./components/AppointmentFilters";
import AppointmentLegend from "./components/AppointmentLegend";
import AppointmentStats from "./components/AppointmentStats";
import AppointmentUpcomingList from "./components/AppointmentUpcomingList";
import { AppointmentToolbar } from "./components/AppointmentToolbar";
import EditRequestModal, {
  type EditRequestPayload,
} from "@/features/dashboard/requests/components/EditRequestModal";
import { useLookups } from "@/features/dashboard/requests/hooks/useLookups";
import {
  updateServiceRequest,
  type ServiceRequestDTO,
} from "@/features/dashboard/requests/services/servicerequests.service";
import { useUpdateServiceRequest } from "@/features/dashboard/requests/hooks/useServiceRequests";
import { buildScheduledAt, splitDateTime } from "@/features/dashboard/requests/utils/schedule";
import { showError, showSuccess } from "@/shared/utils/notifications";
import Swal from "sweetalert2";
import {
  addOrderServiceWorklog,
  fetchOrderServiceHistory,
  updateOrderService,
} from "@/features/dashboard/OrdersServices/api/ordersServices.api";
import type {
  OrdersServiceHistoryItem,
  TechnicianDTO as OrderTechnicianDTO,
} from "@/features/dashboard/OrdersServices/types/ordersServices.types";

import type { AppointmentEvent } from "./types/typeAppointment";
import { buildAppointmentEvents } from "./types/typeAppointment";

import {
  CALENDAR_MESSAGES,
  calendarMaxTime,
  calendarMinTime,
} from "./types/calendar.constants";

import {
  useAppointmentsQuery,
  useAppointmentsUpcomingTotalQuery,
} from "./hooks/useAppointmentsQuery";
import { useAppointmentFilters } from "./hooks/useAppointmentFilters";
import { useAppointmentStats } from "./hooks/useAppointmentStats";
import { useAppointmentResponsive } from "./hooks/useAppointmentResponsive";
import { useRoleScope } from "./hooks/useRoleScope";

import {
  getEventCustomerIds,
  getEventTechnicianUserIds,
  getOrderServiceRequestId,
} from "./helpers/appointment.helpers";
import { getStatePalette } from "./helpers/appointmentState.helpers";
import { parseMaybeNumber, toPositiveNumber } from "./helpers/string.helpers";
import { getApiErrorMessage } from "@/features/auth/utils/authUser";

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
    </div>
  );
}

const tipoToBackend = (tipo?: string | null) => {
  const value = tipo?.toLowerCase() ?? "";
  if (value.includes("instal")) return "INSTALACION";
  return "MANTENIMIENTO";
};

const periodFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
});

type AppointmentToolbarRendererProps = ToolbarProps<AppointmentEvent, object>;
const TECH_COMPLETE_CONFIRM_TAG = "[TECH_COMPLETE_CONFIRM]";
type EditRequestModalInitial = React.ComponentProps<typeof EditRequestModal>["initial"];

export default function IndexAppointment() {
  const { tokenRole, tokenRoleNormalized, clientProfileId, technicianProfileUserId } = useRoleScope();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchHighlightActive, setSearchHighlightActive] = useState(false);
  const {
    calendarView,
    setCalendarView,
    availableViews,
    handleNavigate,
    goToDate,
    currentDate,
    isFullscreen,
    toggleFullscreen,
  } = useAppointmentResponsive();
  const { data, isLoading, isError, refetch } = useAppointmentsQuery(currentDate, debouncedSearchTerm);
  const { data: upcomingTotalData } = useAppointmentsUpcomingTotalQuery();
  const { serviceOptions, customerOptions } = useLookups();
  const updateRequestMutation = useUpdateServiceRequest();

  const resolveTechnicianIdFromOrder = useCallback(
    (event: AppointmentEvent): number | null => {
      if (event.source !== "order") return null;
      const technicians = Array.isArray(event.order?.technicians) ? event.order.technicians : [];
      if (!technicians.length) return null;

      const matchedByUser = technicians.find(
        (t: OrderTechnicianDTO) =>
          Number(t?.users?.userid ?? 0) > 0 &&
          Number(t.users?.userid) === technicianProfileUserId
      );
      const candidate = matchedByUser ?? technicians[0];
      const id = Number(candidate?.technicianid ?? 0);
      return Number.isFinite(id) && id > 0 ? id : null;
    },
    [technicianProfileUserId]
  );

  const registerTechnicianCompletion = useCallback(
    async (event: AppointmentEvent, orderId: number) => {
      const technicianId = resolveTechnicianIdFromOrder(event);
      if (!technicianId) {
        throw new Error("No se pudo identificar el técnico asignado para confirmar la orden.");
      }

      const history = await fetchOrderServiceHistory(orderId);
      const alreadyConfirmed = Array.isArray(history)
        ? history.some((item: OrdersServiceHistoryItem) =>
            String(item?.message ?? "").includes(TECH_COMPLETE_CONFIRM_TAG)
          )
        : false;
      if (alreadyConfirmed) return;

      await addOrderServiceWorklog(orderId, {
        technicianid: technicianId,
        title: "Confirmación técnica de finalización",
        note: `${TECH_COMPLETE_CONFIRM_TAG} Técnico confirmó orden lista para validación del cliente.`,
        progresspercent: 100,
      });
    },
    [resolveTechnicianIdFromOrder]
  );

  const events = useMemo(() => buildAppointmentEvents(data ?? {}), [data]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const scopedAllEvents = useMemo(() => {
    const allEvents = buildAppointmentEvents(upcomingTotalData ?? {});
    return allEvents.filter((event) => {
      if (tokenRoleNormalized === "cliente" && clientProfileId) {
        return getEventCustomerIds(event).includes(clientProfileId);
      }
      if (tokenRoleNormalized === "tecnico" && technicianProfileUserId) {
        return getEventTechnicianUserIds(event).includes(technicianProfileUserId);
      }
      return true;
    });
  }, [upcomingTotalData, tokenRoleNormalized, clientProfileId, technicianProfileUserId]);

  const globalUpcomingCount = useMemo(() => {
    const now = Date.now();
    return scopedAllEvents.filter((event) => event.start.getTime() >= now).length;
  }, [scopedAllEvents]);

  const {
    filteredEvents,
    filteredCount,
    hasActiveFilters,
    stateOptions,
    technicianOptions,
    clientOptions,
    filters,
    handlers,
    clearFilters,
  } = useAppointmentFilters({
    events,
    clientProfileId,
    technicianProfileUserId,
    searchTerm,
  });

  const {
    sourceFilter,
    stateFilter,
    serviceTypeFilter,
    technicianFilter,
    clientFilter,
  } = filters;

  const {
    setSourceFilter,
    setStateFilter,
    setServiceTypeFilter,
    setTechnicianFilter,
    setClientFilter,
  } = handlers;

  const stats = useAppointmentStats({
    events,
    filteredEvents,
    tokenRoleNormalized,
    hasActiveFilters,
    upcomingCountOverride: globalUpcomingCount,
  });

  const searchMatches = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return filteredEvents.slice(0, 30);
  }, [searchTerm, filteredEvents]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setSearchTerm("");
  }, [clearFilters]);

  const handleDownloadExcel = useCallback(async () => {
    if (!filteredEvents.length) {
      showError("No hay citas para descargar.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Citas");

    worksheet.columns = [
      { header: "Origen", key: "source", width: 12 },
      { header: "Codigo", key: "code", width: 16 },
      { header: "Titulo", key: "title", width: 40 },
      { header: "Estado", key: "state", width: 18 },
      { header: "Cliente", key: "client", width: 26 },
      { header: "Inicio", key: "start", width: 20 },
      { header: "Fin", key: "end", width: 20 },
    ];

    filteredEvents.forEach((event) => {
      const code = event.source === "order" ? `OS-${event.id}` : `SR-${event.id}`;
      worksheet.addRow({
        source: event.source === "order" ? "Orden" : "Solicitud",
        code,
        title: event.title,
        state: event.stateLabel,
        client: event.clientLabel,
        start: format(event.start, "yyyy-MM-dd HH:mm"),
        end: format(event.end, "yyyy-MM-dd HH:mm"),
      });
    });

    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `citas-${format(currentDate, "yyyy-MM")}.xlsx`);
  }, [filteredEvents, currentDate]);

  const toolbarComponent = useCallback(
    (props: AppointmentToolbarRendererProps) => (
      <AppointmentToolbar
        {...props}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onDownloadExcel={handleDownloadExcel}
        downloadDisabled={!filteredEvents.length}
      />
    ),
    [
      isFullscreen,
      toggleFullscreen,
      handleDownloadExcel,
      filteredEvents.length,
    ]
  );

  const periodLabel = useMemo(() => periodFormatter.format(currentDate), [currentDate]);
  const showInitialLoader = isLoading && !data;

  const [editingRequest, setEditingRequest] = useState<ServiceRequestDTO | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(null);
  const [modalEvent, setModalEvent] = useState<AppointmentEvent | null>(null);
  const [finalizingEventId, setFinalizingEventId] = useState<number | null>(null);
  const finalizeToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchJumpRef = useRef("");

  const handleSelectSearchMatch = useCallback(
    (event: AppointmentEvent) => {
      goToDate(event.start);
      setSelectedEvent(event);
    },
    [goToDate]
  );

  useEffect(() => {
    return () => {
      if (finalizeToastTimeoutRef.current) {
        clearTimeout(finalizeToastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!filteredEvents.length) {
      setSelectedEvent(null);
      return;
    }

    if (selectedEvent && filteredEvents.some((e) => e.id === selectedEvent.id)) return;
    setSelectedEvent(filteredEvents[0]);
  }, [filteredEvents, selectedEvent]);

  useEffect(() => {
    const hasSearch = debouncedSearchTerm.trim().length > 0;
    if (!hasSearch || isLoading || filteredEvents.length === 0) {
      if (!hasSearch) searchJumpRef.current = "";
      setSearchHighlightActive(false);
      return;
    }

    const firstFound = filteredEvents[0];
    const jumpKey = `${debouncedSearchTerm.trim().toLowerCase()}::${firstFound.source}-${firstFound.id}`;

    if (searchJumpRef.current !== jumpKey) {
      goToDate(firstFound.start);
      searchJumpRef.current = jumpKey;
    }

    setSelectedEvent(firstFound);
    setSearchHighlightActive(true);

    const timeout = setTimeout(() => {
      setSearchHighlightActive(false);
    }, 1800);

    return () => clearTimeout(timeout);
  }, [debouncedSearchTerm, filteredEvents, isLoading, goToDate]);

  const upcomingEvents = useMemo(() => {
    return scopedAllEvents
      .filter((event) => event.start.getTime() >= Date.now())
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [scopedAllEvents]);

  const requestEditInitial = useMemo<EditRequestModalInitial>(() => {
    if (!editingRequest) return null;

    const start = splitDateTime(editingRequest.scheduledAt ?? null);
    const end = splitDateTime(editingRequest.scheduledEndAt ?? null);

    const serviceId = editingRequest.service?.serviceid ?? editingRequest.serviceId;
    const clienteId = editingRequest.customer?.customerid ?? editingRequest.clientId;

    const tipoLabel =
      editingRequest.serviceType ??
      editingRequest.service?.category ??
      editingRequest.service?.name ??
      "";

    const tipoNormalized = tipoLabel.toLowerCase().includes("instal") ? "Instalacion" : "Mantenimiento";

    return {
      serviceId: serviceId && serviceId > 0 ? serviceId : undefined,
      clientId: clienteId && clienteId > 0 ? clienteId : undefined,
      serviceType: tipoToBackend(tipoNormalized),
      description: editingRequest.description ?? "",
      direccion: editingRequest.direccion ?? "",
      scheduledAt: buildScheduledAt(
        start.date ?? null,
        start.time ?? null,
        editingRequest.scheduledAt ? new Date(editingRequest.scheduledAt) : null
      ),
      scheduledEndAt: buildScheduledAt(
        start.date ?? null,
        end.time ?? null,
        editingRequest.scheduledEndAt ? new Date(editingRequest.scheduledEndAt) : null
      ),
      estado: editingRequest.state?.stateid ? String(editingRequest.state.stateid) : undefined,
      stateId: editingRequest.state?.stateid,
      technicians: [],
    };
  }, [editingRequest]);

  const handleRequestSave = async (payload: EditRequestPayload) => {
    if (!editingRequest) return;

    const startParts = splitDateTime(payload.scheduledAt ?? editingRequest.scheduledAt ?? null);
    const endParts = splitDateTime(payload.scheduledEndAt ?? editingRequest.scheduledEndAt ?? null);
    const scheduledAt = buildScheduledAt(
      startParts.date ?? null,
      startParts.time ?? null,
      editingRequest.scheduledAt ? new Date(editingRequest.scheduledAt) : null
    );

    const scheduledEndAt = buildScheduledAt(
      endParts.date ?? startParts.date ?? null,
      endParts.time ?? null,
      editingRequest.scheduledEndAt ? new Date(editingRequest.scheduledEndAt) : null
    );

    const serviceId = parseMaybeNumber(payload.serviceId);
    const clientId = parseMaybeNumber(payload.clientId);
    const stateId = parseMaybeNumber(payload.stateId ?? payload.estado);
    const requestId = toPositiveNumber(
      editingRequest.serviceRequestId ?? editingRequest.servicerequestid ?? editingRequest.id,
    );

    if (!requestId) {
      showError("La solicitud no tiene un identificador valido.");
      return;
    }

    const payloadBody: Record<string, unknown> = {
      serviceType: tipoToBackend(payload.serviceType ?? editingRequest.serviceType),
      description: payload.description?.trim() ?? "",
      direccion: payload.direccion?.trim() ?? "",
      scheduledAt,
      scheduledEndAt,
    };

    if (!Number.isNaN(serviceId) && serviceId > 0) payloadBody.serviceId = serviceId;
    if (!Number.isNaN(clientId) && clientId > 0) payloadBody.clientId = clientId;
    if (!Number.isNaN(stateId) && stateId > 0) payloadBody.stateId = stateId;

    try {
      await updateRequestMutation.mutateAsync({
        id: requestId,
        payload: payloadBody,
      });
      await refetch();
    } catch (err) {
      showError("No se pudo actualizar la solicitud.");
      throw err;
    }
  };

  const handleRequestEdit = (request: ServiceRequestDTO) => setEditingRequest(request);

  const handleCancelEvent = useCallback(
    async (event: AppointmentEvent) => {
      if (!event) return;

      if (event.source === "order") {
        const res = await Swal.fire({
          icon: "warning",
          title: "Cancelar orden",
          text: `¿Deseas cancelar la orden #${event.id}?`,
          showCancelButton: true,
          confirmButtonText: "Sí, cancelar",
          cancelButtonText: "Volver",
          confirmButtonColor: "#04652c",
        });
        if (!res.isConfirmed) return;

        try {
          await updateOrderService(event.id, { stateid: 4 });
          await refetch();
          Swal.fire("Orden cancelada", `La orden #${event.id} fue cancelada correctamente.`, "success");
        } catch (err: unknown) {
          const msg = getApiErrorMessage(err, "No se pudo cancelar la orden.");
          Swal.fire("Error", msg || "No se pudo cancelar la orden.", "error");
        }
        return;
      }

      const res = await Swal.fire({
        title: "¿Cancelar solicitud?",
        text: `Se marcará la solicitud #${event.id} como cancelada.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "Volver",
        confirmButtonColor: "#d33",
        reverseButtons: true,
        focusCancel: true,
      });
      if (!res.isConfirmed) return;

      try {
        await updateServiceRequest(event.id, { stateId: 4 });
        await refetch();
        Swal.fire("Cancelada", "La solicitud fue cancelada.", "success");
      } catch (err: unknown) {
        const msg = getApiErrorMessage(err, "No se pudo cancelar la solicitud.");
        Swal.fire("Error", msg, "error");
      }
    },
    [refetch]
  );

  const handleFinalizeEvent = useCallback(
    async (event: AppointmentEvent) => {
      if (!event) return;

      const orderId =
        event.source === "order" ? toPositiveNumber(event.order?.ordersservicesid) : null;

      const serviceRequestId =
        event.source === "request"
          ? toPositiveNumber(event.request?.serviceRequestId)
          : getOrderServiceRequestId(event.order);

      if (!serviceRequestId && !orderId) {
        Swal.fire("Sin registros relacionados", "La cita no tiene orden ni solicitud asociada.", "warning");
        return;
      }

      const targets = [
        serviceRequestId ? "solicitud de servicio" : null,
        orderId ? "orden de servicio" : null,
      ].filter(Boolean) as string[];

      const isTechnician = tokenRoleNormalized === "tecnico";
      const technicianWillConfirmOrder = isTechnician && !!orderId;
      const verb = targets.length > 1 ? "marcaran" : "marcara";
      const suffix = targets.length > 1 ? "finalizados" : "finalizado";
      const orderText = technicianWillConfirmOrder
        ? "La orden quedara pendiente por confirmacion del cliente."
        : `Se ${verb} ${targets.join(" y ")} como ${suffix}.`;

      const confirm = await Swal.fire({
        title: "Finalizar cita?",
        text: orderText,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Finalizar",
        cancelButtonText: "Cancelar",
      });

      if (!confirm.isConfirmed) return;

      setFinalizingEventId(event.id);

      try {
        const promises: Array<Promise<unknown>> = [];

        if (serviceRequestId) {
          promises.push(updateServiceRequest(serviceRequestId, { stateId: 6 }));
        }

        if (orderId) {
          if (technicianWillConfirmOrder) {
            promises.push(registerTechnicianCompletion(event, orderId));
          } else {
            promises.push(updateOrderService(orderId, { stateid: 6 }));
          }
        }

        if (promises.length) await Promise.all(promises);

        await refetch();

        const successText = technicianWillConfirmOrder
          ? "Se registro la confirmacion del tecnico. Falta la confirmacion del cliente para finalizar la orden."
          : `Se ${verb} ${targets.join(" y ")} como ${suffix}.`;
        setModalEvent(null);
        if (finalizeToastTimeoutRef.current) {
          clearTimeout(finalizeToastTimeoutRef.current);
        }
        finalizeToastTimeoutRef.current = setTimeout(() => {
          showSuccess(successText);
          finalizeToastTimeoutRef.current = null;
        }, 250);
      } catch (err: unknown) {
        console.error("Error al finalizar cita:", err);
        Swal.fire(
          "Error",
          getApiErrorMessage(err, "No se pudieron actualizar los registros."),
          "error"
        );
      } finally {
        setFinalizingEventId(null);
      }
    },
    [refetch, registerTechnicianCompletion, tokenRoleNormalized]
  );

  const eventStyleGetter = (event: AppointmentEvent) => {
    const sourcePalette =
      event.source === "order"
        ? { background: "#2B2B2B", border: "#1F1F1F", text: "#F5F5F0" }
        : { background: "#F5F5F0", border: "#d1d5db", text: "#111827" };

    return {
      style: {
        backgroundColor: sourcePalette.background,
        color: sourcePalette.text,
        border: `1px solid ${sourcePalette.border}`,
        borderRadius: 10,
        padding: "4px 8px",
        fontSize: "12px",
        lineHeight: 1.2,
        boxShadow: searchHighlightActive ? "0 0 0 2px rgba(34,197,94,0.65)" : "none",
        animation: searchHighlightActive ? "appointment-search-pulse 0.9s ease-in-out 2" : "none",
      },
    };
  };

  const CalendarEvent = ({ event }: { event: AppointmentEvent }) => {
    const palette = getStatePalette(event.stateLabel);
    const isOrder = event.source === "order";
    const textColor = isOrder ? "#ffffff" : "#111827";

    return (
      <div className="flex flex-col gap-1 truncate">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 flex-none rounded-full border" style={{ backgroundColor: palette.background, borderColor: palette.border }} />
          <span className="truncate text-[11px] font-semibold" style={{ color: textColor }}>
            {event.title}
          </span>
        </div>
        <span className="truncate text-[10px] tracking-wide uppercase" style={{ color: textColor }}>
          {event.stateLabel}
        </span>
      </div>
    );
  };

  const calendarHeight = isFullscreen ? "h-[calc(100vh-160px)]" : "h-[calc(100vh-420px)]";

  return (
    <>
      <ToastContainer position="bottom-right" newestOnTop limit={3} style={{ zIndex: 1000000 }} />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-green-100 p-2 text-green-600">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Agenda</p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Calendario de Órdenes y servicios
              </h1>
              <p className="text-xs text-slate-500">Mes actual: {periodLabel}</p>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .hide-sunday .rbc-header.rbc-week-header.rbc-time-header-cell:nth-child(7),
          .hide-sunday .rbc-day-slot:nth-child(7),
          .hide-sunday .rbc-day-slot:nth-child(7) > .rbc-day-slot-toolbar,
          .hide-sunday .rbc-row-content > .rbc-day-slot:nth-child(7),
          .hide-sunday .rbc-time-column .rbc-day-slot:nth-child(7) {
            display: none;
          }
          .hide-sunday .rbc-time-view {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }
          .app-calendar .rbc-calendar {
            border-radius: 10px;
            overflow: hidden;
          }
          .app-calendar .rbc-calendar > * {
            border-radius: inherit;
          }
          @keyframes appointment-search-pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
            }
            50% {
              transform: scale(1.03);
              box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
            }
          }
        `}</style>

        <AppointmentDetailModal
          open={!!modalEvent}
          event={modalEvent}
        onClose={() => setModalEvent(null)}
        onEditRequest={handleRequestEdit}
        onCancel={handleCancelEvent}
        onFinalize={handleFinalizeEvent}
        isFinalizing={Boolean(modalEvent) && finalizingEventId === modalEvent?.id}
      />

        <AppointmentStats stats={stats} />

        <AppointmentFilters
          eventsLength={events.length}
          filteredCount={filteredCount}
          hasActiveFilters={hasActiveFilters}
          showClientFilter={tokenRole !== "Cliente"}
          stateOptions={stateOptions}
          technicianOptions={technicianOptions}
          clientOptions={clientOptions}
          sourceFilter={sourceFilter}
          stateFilter={stateFilter}
          searchTerm={searchTerm}
          serviceTypeFilter={serviceTypeFilter}
          technicianFilter={technicianFilter}
          clientFilter={clientFilter}
          searchMatches={searchMatches}
          selectedEventKey={selectedEvent ? `${selectedEvent.source}-${selectedEvent.id}` : null}
          onSourceChange={(value) => setSourceFilter(value as typeof sourceFilter)}
          onStateChange={(value) => setStateFilter(value)}
          onSearchChange={setSearchTerm}
          onServiceTypeChange={(value) => setServiceTypeFilter(value as typeof serviceTypeFilter)}
          onTechnicianChange={setTechnicianFilter}
          onClientChange={setClientFilter}
          onSelectSearchMatch={handleSelectSearchMatch}
          onClearFilters={handleClearFilters}
        />

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          {isError && (
            <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              Error al cargar las citas.
            </div>
          )}

          {showInitialLoader ? (
            <Loader />
          ) : (
            <div
              className={`relative ${calendarHeight} min-h-[420px] max-h-[75vh] overflow-hidden ${
                calendarView === "week" ? "hide-sunday" : ""
              } app-calendar`}
            >
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                messages={CALENDAR_MESSAGES}
                culture="es"
                view={calendarView}
                views={availableViews}
                components={{
                  toolbar: toolbarComponent,
                  event: CalendarEvent,
                }}
                onView={(v) => setCalendarView(v)}
                onNavigate={handleNavigate}
                date={currentDate}
                onSelectEvent={(e) => {
                  const evt = e as AppointmentEvent;
                  setSelectedEvent(evt);
                  setModalEvent(evt);
                }}
                eventPropGetter={(e) => eventStyleGetter(e as AppointmentEvent)}
                min={calendarMinTime}
                max={calendarMaxTime}
              />
            </div>
          )}
        </div>

        <AppointmentUpcomingList
          events={upcomingEvents}
          selectedEventKey={
            selectedEvent ? `${selectedEvent.source}-${selectedEvent.id}` : null
          }
          onSelect={(event) => {
            setSelectedEvent(event);
            setModalEvent(event);
          }}
        />

        {editingRequest && (
          <EditRequestModal
            key={`edit-request-${editingRequest.serviceRequestId}`}
            isOpen={Boolean(editingRequest)}
            onClose={() => setEditingRequest(null)}
            onSave={handleRequestSave}
            initial={requestEditInitial}
            servicios={serviceOptions}
            clientes={customerOptions}
            title="Editar Solicitud"
          />
        )}
      </div>

      <AppointmentLegend
        open={showLegend}
        onClose={() => setShowLegend(false)}
        onToggle={() => setShowLegend((prev) => !prev)}
      />

    </>
  );
}
