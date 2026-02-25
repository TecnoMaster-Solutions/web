"use client";

import { useRouter } from "next/navigation";
import { routes } from "@/shared/routes";
import { actionButtonClass, dangerButtonClass } from "./actionButtonClasses";

export type OrderActionsProps = {
  orderId: number;
  canEdit?: boolean;
  canCancel?: boolean;
  onCancel?: (orderId: number) => void;
};

const OrderActions = ({
  orderId,
  canEdit = false,
  canCancel = false,
  onCancel,
}: OrderActionsProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2 pt-3">
      {canEdit && (
        <button
          onClick={() =>
            router.push(`${routes.dashboard.ordersServices}/edit?ordersservicesid=${orderId}`)
          }
          className={actionButtonClass}
          type="button"
        >
          Editar
        </button>
      )}
      <button
        onClick={() => router.push(`${routes.dashboard.orders}/${orderId}`)}
        className={actionButtonClass}
        type="button"
      >
        Ver detalle
      </button>
      {canCancel && (
        <button
          onClick={() =>
            onCancel
              ? onCancel(orderId)
              : router.push(`${routes.dashboard.ordersServices}?orderId=${orderId}&action=cancel`)
          }
          className={dangerButtonClass}
          type="button"
        >
          Cancelar
        </button>
      )}
    </div>
  );
};

export default OrderActions;
