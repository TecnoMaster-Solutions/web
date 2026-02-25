"use client";

import type { AppointmentEvent } from "../types/typeAppointment";
import type { ServiceRequestDTO } from "@/features/dashboard/requests/services/servicerequests.service";
import AppointmentDetailContent from "./AppointmentDetailContent";
import Modal from "../../components/Modal";

export type AppointmentDetailCardProps = {
  open: boolean;
  event: AppointmentEvent | null;
  onClose: () => void;
  onEditRequest?: (request: ServiceRequestDTO) => void;
  onFinalize?: (event: AppointmentEvent) => void;
  onCancel?: (event: AppointmentEvent) => void;
  isFinalizing?: boolean;
};

const AppointmentDetailCard = ({
  open,
  event,
  onClose,
  onEditRequest,
  onFinalize,
  onCancel,
  isFinalizing,
}: AppointmentDetailCardProps) => (
  <Modal isOpen={open} onClose={onClose} title="Detalle de la cita" widthClass="md:max-w-3xl">
    {event && (
      <AppointmentDetailContent
        event={event}
        onEditRequest={onEditRequest}
        onFinalize={onFinalize}
        onCancel={onCancel}
        isFinalizing={isFinalizing}
      />
    )}
  </Modal>
);

export default AppointmentDetailCard;
