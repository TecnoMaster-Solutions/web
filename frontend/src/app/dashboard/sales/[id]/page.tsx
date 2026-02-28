"use client";

import { use, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import SaleDetailContent from "@/features/dashboard/sales/components/SaleDetailContent";

interface SaleDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function SaleDetailPage({ params }: SaleDetailPageProps): ReactElement {
    const router = useRouter();
    const resolvedParams = use(params);
    const saleId = Number(resolvedParams.id);

    if (!Number.isFinite(saleId) || saleId <= 0) {
        return <div className="p-6 text-center text-red-500">ID de venta inválido.</div>;
    }

    return (
        <div className="p-4 md:p-6">
            <SaleDetailContent saleId={saleId} onBack={() => router.push("/dashboard/sales")} />
        </div>
    );
}
