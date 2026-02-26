"use client";

import { useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { usePurchaseOrders } from "./hooks/usePurchaseOrders";
import CreatePurchaseOrderModal from "./components/CreatePurchaseOrderModal/CreatePurchaseOrder";
import PurchaseOrdersTable from "./components/PurchaseOrdersTable/PurchaseOrdersTable";
import ViewPurchaseOrderModal from "./components/ViewPurchaseOrderModal/viewPurchaseOrder";
import { purchaseOrder } from "./types/typesPurchaseOrder";

export default function PurchaseOrdersIndex() {
  const {
    purchaseOrders,
    loading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    viewingPurchaseOrder,
    handleCreatePurchaseOrder,
    handleView,
    closeModals,
  } = usePurchaseOrders();

  const isViewModalOpen = !!viewingPurchaseOrder;

  // ── Ordenamiento ──────────────────────────────────────────────────────────
  type SortField = "fecha" | "total";
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedOrders = useMemo((): purchaseOrder[] => {
    if (!sortField) return purchaseOrders;
    return [...purchaseOrders].sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortField === "fecha") {
        aVal = new Date(a.fecha).getTime();
        bVal = new Date(b.fecha).getTime();
      } else {
        aVal = a.total ?? 0;
        bVal = b.total ?? 0;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [purchaseOrders, sortField, sortDir]);

  // ── Botones de sort para pasar via prop al DataTable ──────────────────────
  const sortButtons = (
    <div className="flex items-center gap-2">
      {(["fecha", "total"] as const).map((field) => (
        <button
          key={field}
          onClick={() => handleSort(field)}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${sortField === field
            ? "bg-red-600 text-white border-red-600"
            : "text-gray-600 bg-white hover:bg-gray-50 border-gray-300"
            }`}
          title={`Ordenar por ${field === "fecha" ? "Fecha" : "Total"}`}
        >
          {field === "fecha" ? "Fecha" : "Total"}
          <span className="text-xs">
            {sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Notificaciones */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme="light"
      />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col">
          <div className="px-6 pt-6 space-y-6">

            {/* Modal Crear */}
            <CreatePurchaseOrderModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSave={handleCreatePurchaseOrder}
            />

            {/* Modal Ver */}
            <ViewPurchaseOrderModal
              isOpen={isViewModalOpen}
              onClose={closeModals}
              purchaseOrder={viewingPurchaseOrder}
            />

            {/* Tabla con estado de carga */}
            {loading && purchaseOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-64 bg-gray-100 rounded w-full"></div>
                </div>
              </div>
            ) : (
              <PurchaseOrdersTable
                purchaseOrders={sortedOrders}
                onView={handleView}
                onCreate={() => setIsCreateModalOpen(true)}
                rightActions={sortButtons}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}