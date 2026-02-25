"use client";

import { useMemo } from "react";
import type { AppointmentEvent } from "../types/typeAppointment";
import type { ServiceRequestDTO } from "@/features/dashboard/requests/services/servicerequests.service";
import OrderActions from "./OrderActions";
import RequestActions from "./RequestActions";
import { techLabel } from "../helpers/appointmentLabels.helpers";
import { detailFormatter, currencyFormatter } from "../helpers/appointmentFormatters.helpers";
import { useAppointmentPermissions } from "../hooks/useAppointmentPermissions";
import { getStatePalette } from "../helpers/appointmentState.helpers";

export type AppointmentDetailContentProps = {
  event: AppointmentEvent;
  onEditRequest?: (request: ServiceRequestDTO) => void;
  onFinalize?: (event: AppointmentEvent) => void;
  onCancel?: (event: AppointmentEvent) => void;
  isFinalizing?: boolean;
};

const AppointmentDetailContent = ({
  event,
  onEditRequest,
  onFinalize,
  onCancel,
  isFinalizing = false,
}: AppointmentDetailContentProps) => {
  const palette = getStatePalette(event.stateLabel);
  const {
    canEditOrder,
    canCancelOrder,
    canEditRequest,
    canCancelRequest,
    canFinalizeEvent,
  } = useAppointmentPermissions(event);

  const total = useMemo(() => {
    if (
      event.source === "order" &&
      typeof event.order?.total === "number" &&
      Number.isFinite(event.order.total)
    ) {
      return currencyFormatter.format(event.order.total);
    }

    if (event.source === "request" && typeof event.request?.service?.price === "number") {
      return currencyFormatter.format(event.request.service.price);
    }

    return "Sin total definido";
  }, [event]);

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cita seleccionada</p>
          <h2 className="truncate text-lg font-semibold text-slate-900">{event.title}</h2>
          <p className="truncate text-sm text-slate-500">{event.clientLabel}</p>
        </div>
        <span
          className="w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: palette.background, color: palette.text }}
        >
          {event.stateLabel}
        </span>
      </div>

      <div>
        <p className="text-xs uppercase text-slate-400">Tipo de evento</p>
        <p className="font-semibold text-slate-900">
          {event.source === "order" ? "Orden de servicio" : "Solicitud de servicio"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-slate-400">Inicio</p>
          <p className="font-semibold text-slate-900">{detailFormatter.format(event.start)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Fin</p>
          <p className="font-semibold text-slate-900">{detailFormatter.format(event.end)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase text-slate-400">Técnicos</p>
        <p className="font-semibold text-slate-900">{techLabel(event)}</p>
      </div>

      <div>
        <p className="text-xs uppercase text-slate-400">Descripción</p>
        <p className="break-words">
          {(event.source === "order"
            ? event.order?.description
            : event.request?.description)?.trim() ||
            "Sin descripción adicional registrada."}
        </p>
      </div>

      {event.source === "request" && event.request?.direccion && (
        <div>
          <p className="text-xs uppercase text-slate-400">Dirección</p>
          <p className="font-semibold text-slate-900">{event.request.direccion}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-slate-400">
          {event.source === "order" ? "Total estimado" : "Precio estimado"}
        </p>
        <p className="font-semibold text-slate-900">{total}</p>
      </div>

      {event.source === "order" ? (
        <OrderActions
          orderId={event.order.ordersservicesid}
          canEdit={canEditOrder}
          canCancel={canCancelOrder}
          onCancel={() => onCancel?.(event)}
        />
      ) : (
        event.request &&
        onEditRequest && (
          <RequestActions
            request={event.request}
            onEdit={onEditRequest}
            canEdit={canEditRequest}
            canCancel={canCancelRequest}
            onCancel={() => onCancel?.(event)}
          />
        )
      )}

      {onFinalize && canFinalizeEvent && (
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => onFinalize(event)}
            disabled={isFinalizing}
            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-wait disabled:opacity-70"
          >
            {isFinalizing ? "Finalizando..." : "Finalizar cita"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetailContent;
