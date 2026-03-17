"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import { getSaleById } from "../services/sales.service";
import { ISale } from "../types/Sales.type";
import SalePaymentRequestsSection from "./SalePaymentRequestsSection";
import { showError } from "@/shared/utils/notifications";

interface SalePaymentsModalProps {
    saleId: number | null;
    onClose: () => void;
    onSaved?: () => void;
}

export default function SalePaymentsModal({
    saleId,
    onClose,
    onSaved,
}: SalePaymentsModalProps) {
    const [sale, setSale] = useState<ISale | null>(null);
    const [, setLoading] = useState(false);

    const handleSaleUpdated = useCallback(
        (updatedSale: ISale) => {
            setSale(updatedSale);
            onSaved?.();
        },
        [onSaved]
    );

    useEffect(() => {
        if (!saleId) {
            setSale(null);
            return;
        }

        setLoading(true);
        getSaleById(saleId)
            .then((response) => setSale(response))
            .catch((error) => {
                console.error(error);
                showError("No se pudo cargar la venta para registrar pagos.");
                onClose();
            })
            .finally(() => setLoading(false));
    }, [saleId, onClose]);

    return (
        <Modal
            title="Gestionar pagos"
            isOpen={!!saleId}
            onClose={onClose}
            widthClass="max-w-4xl"
        >
            {sale ? (
                <div className="space-y-4">
                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{sale.salecode}</div>
                        <div>
                            Cliente:{" "}
                            {sale.customer?.users
                                ? `${sale.customer.users.name} ${sale.customer.users.lastname}`
                                : `Cliente #${sale.customerid}`}
                        </div>
                    </div>

                    <SalePaymentRequestsSection
                        sale={sale}
                        onSaleUpdated={handleSaleUpdated}
                    />
                </div>
            ) : null}
        </Modal>
    );
}
