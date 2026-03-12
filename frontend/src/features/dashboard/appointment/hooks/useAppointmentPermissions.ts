"use client";

import { useMemo } from "react";
import type { AppointmentEvent } from "../types/typeAppointment";
import {
  getPermissionsFromTokenCookie,
  hasPermissionFromToken,
} from "../helpers/authToken.helpers";
import { normalizeStateKey } from "../helpers/appointmentState.helpers";

export const useAppointmentPermissions = (event?: AppointmentEvent | null) => {
  const permissions = useMemo(() => getPermissionsFromTokenCookie(), []);
  const hasAnyPermissions = permissions.length > 0;
  const canUpdateAppointment = hasPermissionFromToken(permissions, "appointments", "update");
  const canDeactivateAppointment = hasPermissionFromToken(permissions, "appointments", "deactivate");

  const normalizedState =
    event && typeof event.stateLabel === "string" ? normalizeStateKey(event.stateLabel) : "";
  const isClosedLabel = [
    "finalizado",
    "finished",
    "finalized",
    "finish",
    "cancelado",
    "canceled",
    "cancelled",
    "cancel",
  ].includes(normalizedState);
  const isClosedStateId = event
    ? [event.order?.state?.stateid, event.request?.state?.stateid].some(
        (value) => Number.isFinite(Number(value)) && [4, 6].includes(Number(value))
      )
    : false;
  const shouldHideFinalizeButton = isClosedLabel || isClosedStateId;

  const canEditOrder =
    Boolean(event && event.source === "order") &&
    !shouldHideFinalizeButton &&
    hasAnyPermissions &&
    canUpdateAppointment;
  const canReprogramOrder = canEditOrder;
  const canCancelOrder =
    Boolean(event && event.source === "order") &&
    !shouldHideFinalizeButton &&
    hasAnyPermissions &&
    canDeactivateAppointment;

  const canEditRequest =
    Boolean(event && event.source === "request") &&
    !shouldHideFinalizeButton &&
    hasAnyPermissions &&
    canUpdateAppointment;
  const canReprogramRequest = canEditRequest;
  const canCancelRequest =
    Boolean(event && event.source === "request") &&
    !shouldHideFinalizeButton &&
    hasAnyPermissions &&
    canDeactivateAppointment;

  const canFinalizeEvent =
    Boolean(event) && !shouldHideFinalizeButton && hasAnyPermissions && canDeactivateAppointment;

  return {
    canEditOrder,
    canReprogramOrder,
    canCancelOrder,
    canEditRequest,
    canReprogramRequest,
    canCancelRequest,
    canFinalizeEvent,
  };
};
