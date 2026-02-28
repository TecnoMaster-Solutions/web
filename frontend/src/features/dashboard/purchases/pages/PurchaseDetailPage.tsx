"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RequireAuth from "@/features/auth/requireauth";
import ViewPurchase from "../components/ViewPurchase";
import { usePurchases } from "../hooks/usePurchases";
import { IPurchase } from "../Types/Purchase.type";

export default function PurchasesDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const idParam = params?.id;

    const purchasesHook = usePurchases();
    const { purchases, loading, fetchPurchases } = purchasesHook;

    const ran = useRef(false);

    const [purchaseSnapshot, setPurchaseSnapshot] = useState<IPurchase | null>(
        null
    );

    const numericId = useMemo(() => Number(idParam), [idParam]);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        fetchPurchases().catch((e) =>
            console.error("Error fetchPurchases (detail):", e)
        );
    }, [fetchPurchases]);

    useEffect(() => {
        if (!numericId || purchaseSnapshot) return;
        if (!Array.isArray(purchases) || purchases.length === 0) return;

        const found =
            purchases.find((p: any) => Number(p.purchaseorderid) === numericId) ??
            null;

        if (found) setPurchaseSnapshot(found);
    }, [numericId, purchases, purchaseSnapshot]);

    const purchase = purchaseSnapshot;

    return (
        <RequireAuth>
            <ToastContainer position="bottom-right" />

            <div className="p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                            Detalle de compra
                        </h1>
                        <p className="text-sm text-gray-500">
                            Revisa la información general, proveedor y productos comprados.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/purchases")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition
                 hover:bg-gray-50 hover:shadow
                 focus:outline-none focus:ring-2 focus:ring-black/20 active:scale-[0.99]
                 w-full sm:w-auto"
                        title="Volver"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                        Volver
                    </button>
                </div>

                {loading && !purchase && (
                    <div className="bg-white rounded-xl shadow-lg p-4">
                        <div className="animate-pulse space-y-4">
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-64 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                )}

                {!loading && !purchase && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <p className="text-gray-700">
                            No se encontró la compra solicitada o no tienes acceso.
                        </p>
                    </div>
                )}

                {purchase && <ViewPurchase purchase={purchase} />}
            </div>
        </RequireAuth>
    );
}