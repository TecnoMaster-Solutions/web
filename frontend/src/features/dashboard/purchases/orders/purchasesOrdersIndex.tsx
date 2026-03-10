"use client";

import { useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { usePurchaseOrders } from "./hooks/usePurchaseOrders";
import CreatePurchaseOrderPage from "./components/CreatePurchaseOrderPage/CreatePurchaseOrderPage";
import PurchaseOrdersTable from "./components/PurchaseOrdersTable/PurchaseOrdersTable";
import ViewPurchaseOrderPage from "./components/ViewPurchaseOrderPage/ViewPurchaseOrderPage";
import { purchaseOrder } from "./types/typesPurchaseOrder";

type ViewState = "list" | "create" | "view";

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

  // Manage view state
  const [currentView, setCurrentView] = useState<ViewState>("list");
  const [selectedOrder, setSelectedOrder] = useState<purchaseOrder | null>(null);

  // Sorting
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

  // Handlers for navigation
  const handleCreateClick = () => {
    setCurrentView("create");
  };

  const handleViewClick = (order: purchaseOrder) => {
    setSelectedOrder(order);
    setCurrentView("view");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedOrder(null);
    closeModals();
  };

  const handleOrderSaved = () => {
    setCurrentView("list");
    setSelectedOrder(null);
  };

  return (
    <div className="flex">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme="light"
      />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col">
          <div className="px-6 pt-6 pb-6 space-y-6">

            {/* Header - Only show when not in list view */}
            {currentView !== "list" && (
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={handleBackToList}
                  aria-label="Volver"
                  title="Volver"
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    {currentView === "create" ? "Crear Orden de Compra" : "Ver Orden de Compra"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {currentView === "create"
                      ? "Registre una nueva orden de compra — complete los datos y guarde"
                      : "Detalles de la orden de compra"
                    }
                  </p>
                </div>
              </div>
            )}

            {/* List View */}
            {currentView === "list" && (
              <>
                {loading && purchaseOrders.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 border-4 border-[#2a9781] border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-gray-500">Cargando órdenes de compra...</p>
                    </div>
                  </div>
                ) : (
                  <PurchaseOrdersTable
                    purchaseOrders={sortedOrders}
                    onView={handleViewClick}
                    onCreate={handleCreateClick}
                  />
                )}
              </>
            )}

            {/* Create View */}
            {currentView === "create" && (
              <CreatePurchaseOrderPage
                onClose={handleBackToList}
                onSaved={handleOrderSaved}
                onSave={handleCreatePurchaseOrder}
              />
            )}

            {/* View Order */}
            {currentView === "view" && selectedOrder && (
              <ViewPurchaseOrderPage
                purchaseOrder={selectedOrder}
                onClose={handleBackToList}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

