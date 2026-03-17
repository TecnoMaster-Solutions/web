"use client";

import Modal from "@/features/dashboard/components/Modal";
import SaleDetailContent from "./SaleDetailContent";

interface SaleDetailModalProps {
    saleId: number | null;
    onClose: () => void;
}

export default function SaleDetailModal({ saleId, onClose }: SaleDetailModalProps) {
    return (
        <Modal
            isOpen={!!saleId}
            onClose={onClose}
            title=""
            widthClass="max-w-4xl"
        >
            {saleId ? <SaleDetailContent saleId={saleId} onBack={onClose} /> : null}
        </Modal>
    );
}
