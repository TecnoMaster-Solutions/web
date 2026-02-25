"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarDays } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import AppointmentDetailModal from "./components/AppointmentDetailCard";
import AppointmentFilters from "./components/AppointmentFilters";
import AppointmentLegend from "./components/AppointmentLegend";
import AppointmentStats from "./components/AppointmentStats";
import AppointmentUpcomingList from "./components/AppointmentUpcomingList";
import { AppointmentToolbar, type AppointmentToolbarProps } from "./components/AppointmentToolbar";
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

import type { AppointmentEvent } from "./types/typeAppointment";
import { buildAppointmentEvents } from "./types/typeAppointment";

import {
  CALENDAR_MESSAGES,
  SERVICE_TYPE_FILTERS,
  calendarMaxTime,
  calendarMinTime,
} from "./types/calendar.constants";

import { useAppointmentsQuery } from "./hooks/useAppointmentsQuery";
import { useAppointmentFilters } from "./hooks/useAppointmentFilters";
import { useAppointmentStats } from "./hooks/useAppointmentStats";
import { useAppointmentResponsive } from "./hooks/useAppointmentResponsive";
import { useRoleScope } from "./hooks/useRoleScope";

import { getOrderServiceRequestId } from "./helpers/appointment.helpers";
import { getStatePalette } from "./helpers/appointmentState.helpers";
import { parseMaybeNumber, toPositiveNumber } from "./helpers/string.helpers";

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
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
    </div>
  );
}

const escapeIcsText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const formatIcsDate = (date: Date) =>
  date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

const buildCalendarIcs = (events: AppointmentEvent[]) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VerteCX//Appointments//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const stamp = formatIcsDate(new Date());

  events.forEach((event) => {
    const uid = `${event.source}-${event.id}-${event.start.getTime()}@vertecx`;
    const summary = escapeIcsText(event.title);
    const description = escapeIcsText(`${event.stateLabel} - ${event.clientLabel}`);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${formatIcsDate(event.start)}`);
    lines.push(`DTEND:${formatIcsDate(event.end)}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
};

const tipoToBackend = (tipo?: string | null) => {
  const value = tipo?.toLowerCase() ?? "";
  if (value.includes("instal")) return "INSTALACION";
  return "MANTENIMIENTO";
};

const periodFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
});

type AppointmentToolbarRendererProps = Omit<AppointmentToolbarProps, "isFullscreen" | "onToggleFullscreen">;
const TECH_COMPLETE_CONFIRM_TAG = "[TECH_COMPLETE_CONFIRM]";

export default function IndexAppointment() {
  const { tokenRole, tokenRoleNormalized, clientProfileId, technicianProfileUserId } = useRoleScope();
  const { data, isLoading, isError, refetch } = useAppointmentsQuery();
  const { serviceOptions, customerOptions } = useLookups();
  const updateRequestMutation = useUpdateServiceRequest();
  const {
    calendarView,
    setCalendarView,
    availableViews,
    handleNavigate,
    currentDate,
    isFullscreen,
    toggleFullscreen,
  } = useAppointmentResponsive();

  const resolveTechnicianIdFromOrder = useCallback(
    (event: AppointmentEvent): number | null => {
      if (event.source !== "order") return null;
      const technicians = Array.isArray(event.order?.technicians) ? event.order.technicians : [];
      if (!technicians.length) return null;

      const matchedByUser = technicians.find(
        (t: any) => Number(t?.users?.userid ?? 0) > 0 && Number(t.users.userid) === technicianProfileUserId
      );
      const candidate = matchedByUser ?? technicians[0];
      const id = Number((candidate as any)?.technicianid ?? 0);
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
        ? history.some((item: any) => String(item?.message ?? "").includes(TECH_COMPLETE_CONFIRM_TAG))
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
  });

  const {
    sourceFilter,
    stateFilter,
    searchTerm,
    serviceTypeFilter,
    technicianFilter,
    clientFilter,
  } = filters;

  const {
    setSourceFilter,
    setStateFilter,
    setSearchTerm,
    setServiceTypeFilter,
    setTechnicianFilter,
    setClientFilter,
  } = handlers;

  const stats = useAppointmentStats({
    events,
    filteredEvents,
    tokenRole,
    tokenRoleNormalized,
    hasActiveFilters,
  });

  const handleDownloadCalendar = useCallback(() => {
    if (!filteredEvents.length) {
      showError("No hay citas para descargar.");
      return;
    }

    const ics = buildCalendarIcs(filteredEvents);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = format(currentDate, "yyyy-MM");

    anchor.href = url;
    anchor.download = `citas-${stamp}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [filteredEvents, currentDate]);

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
        onDownloadCalendar={handleDownloadCalendar}
        onDownloadExcel={handleDownloadExcel}
        downloadDisabled={!filteredEvents.length}
      />
    ),
    [
      isFullscreen,
      toggleFullscreen,
      handleDownloadCalendar,
      handleDownloadExcel,
      filteredEvents.length,
    ]
  );

  const periodLabel = useMemo(() => periodFormatter.format(currentDate), [currentDate]);

  const [editingRequest, setEditingRequest] = useState<ServiceRequestDTO | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(null);
  const [modalEvent, setModalEvent] = useState<AppointmentEvent | null>(null);
  const [finalizingEventId, setFinalizingEventId] = useState<number | null>(null);

  useEffect(() => {
    if (!filteredEvents.length) {
      setSelectedEvent(null);
      return;
    }

    if (selectedEvent && filteredEvents.some((e) => e.id === selectedEvent.id)) return;
    setSelectedEvent(filteredEvents[0]);
  }, [filteredEvents, selectedEvent]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return filteredEvents.filter((e) => e.start.getTime() >= now).slice(0, 4);
  }, [filteredEvents]);

  const requestEditInitial = useMemo<EditRequestPayload | null>(() => {
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
      tipos: [tipoNormalized] as ("Mantenimiento" | "Instalacion")[],
      servicio: serviceId ? String(serviceId) : "",
      cliente: clienteId ? String(clienteId) : "",
      descripcion: editingRequest.description ?? "",
      direccion: editingRequest.direccion ?? "",
      programada: start.date,
      horaProgramada: start.time,
      horaFinal: end.time,
      estado: editingRequest.state?.stateid ? String(editingRequest.state.stateid) : undefined,
    };
  }, [editingRequest]);

  const handleRequestSave = async (payload: EditRequestPayload) => {
    if (!editingRequest) return;

    const scheduledAt = buildScheduledAt(
      payload.programada ?? null,
      payload.horaProgramada ?? null,
      editingRequest.scheduledAt ? new Date(editingRequest.scheduledAt) : null
    );

    const scheduledEndAt = buildScheduledAt(
      payload.programada ?? null,
      payload.horaFinal ?? null,
      editingRequest.scheduledEndAt ? new Date(editingRequest.scheduledEndAt) : null
    );

    const serviceId = parseMaybeNumber(payload.servicio);
    const clientId = parseMaybeNumber(payload.cliente);
    const stateId = parseMaybeNumber(payload.estado);

    const payloadBody: Record<string, unknown> = {
      serviceType: tipoToBackend(payload.tipos?.[0] ?? editingRequest.serviceType),
      description: payload.descripcion?.trim() ?? "",
      direccion: payload.direccion?.trim() ?? "",
      scheduledAt,
      scheduledEndAt,
    };

    if (!Number.isNaN(serviceId) && serviceId > 0) payloadBody.serviceId = serviceId;
    if (!Number.isNaN(clientId) && clientId > 0) payloadBody.clientId = clientId;
    if (!Number.isNaN(stateId) && stateId > 0) payloadBody.stateId = stateId;

    try {
      await updateRequestMutation.mutateAsync({
        id: editingRequest.serviceRequestId,
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
          confirmButtonColor: "#B20000",
        });
        if (!res.isConfirmed) return;

        try {
          await updateOrderService(event.id, { stateid: 4 });
          await refetch();
          Swal.fire("Orden cancelada", `La orden #${event.id} fue cancelada correctamente.`, "success");
        } catch (err: any) {
          const msg = err?.response?.data?.message?.[0] || err?.response?.data?.message || err?.message;
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
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? err?.message ?? "No se pudo cancelar la solicitud.";
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
        const promises: Promise<any>[] = [];

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
        showSuccess(successText);
      } catch (err: any) {
        console.error("Error al finalizar cita:", err);
        Swal.fire(
          "Error",
          err?.response?.data?.message ?? err?.message ?? "No se pudieron actualizar los registros.",
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
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-red-100 p-2 text-red-600">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Agenda</p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Calendario de órdenes y servicios
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
          onSourceChange={setSourceFilter}
          onStateChange={setStateFilter}
          onSearchChange={setSearchTerm}
          onServiceTypeChange={setServiceTypeFilter}
          onTechnicianChange={setTechnicianFilter}
          onClientChange={setClientFilter}
          onClearFilters={clearFilters}
        />

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          {isError && (
            <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              Error al cargar las citas.
            </div>
          )}

          {isLoading ? (
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
          selectedEventId={selectedEvent?.id ?? null}
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

