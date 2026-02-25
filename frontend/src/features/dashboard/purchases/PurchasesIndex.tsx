"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import RequireAuth from "../../auth/requireauth";
import { DataTable } from "../components/datatable/DataTable";
import Modal from "../components/Modal";
import RegisterPurchaseForm from "./components/RegisterPurchase";
import { IPurchase } from "./Types/Purchase.type";
import ViewPurchase from "./components/ViewPurchase";
import { ToastContainer } from "react-toastify";
import { Column } from "../components/datatable/types/column.types";
import { usePurchases } from "./hooks/usePurchases";
import { useLoader } from "@/shared/components/loader";

export default function PurchasesIndex() {
  const purchasesHook = usePurchases();
  const { showLoader, hideLoader } = useLoader();
  const [isCancelling, setIsCancelling] = useState<number | null>(null);
  const { fetchPurchases } = purchasesHook;

  // Solo extraer lo necesario para el DataTable
  const {
    purchases,
    loading,
    saving,
    handleAddPurchase,
    handleCancelPurchase,
    form,
    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    cart,
    total,
    handleChange,
    handleAddProduct,
    products,
    suppliers,
    removeFromCart,
    resetForm,
  } = purchasesHook;

  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<IPurchase | null>(
    null
  );

  // Refs para controlar renderizados
  const initialLoadDone = useRef(false);
  const dataLoaded = useRef(false);

  // Ejecutar solo cuando el componente se monta (primera carga)
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      showLoader();
      fetchPurchases().finally(() => {
        dataLoaded.current = true;
      });
    }
  }, []);

  // Manejar el loader basado en el estado de loading
  useEffect(() => {
    if (!loading && initialLoadDone.current) {
      const timer = setTimeout(() => {
        if (dataLoaded.current) {
          hideLoader();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, hideLoader]);

  // Manejar el loader durante el guardado
  useEffect(() => {
    if (saving) {
      showLoader();
    } else {
      if (!loading) {
        hideLoader();
      }
    }
  }, [saving, loading, showLoader, hideLoader]);

  // Memorizar columnas - MANTENER ESTE ORDEN
  const columns: Column<IPurchase>[] = useMemo(
    () => [
      { key: "numberoforder", header: "N° Orden" },
      { key: "reference", header: "N° Factura" },
      {
        key: "supplier",
        header: "Proveedor",
        render: (row) => row.supplier?.name ?? "N/A",
      },
      {
        key: "createdat",
        header: "Fecha de Registro",
        render: (row) => new Date(row.createdat).toLocaleDateString(),
      },
      {
        key: "amount",
        header: "Monto",
        render: (row) =>
          row.amount.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
          }),
      },
      {
        key: "state",
        header: "Estado",
        render: (row) => {
          const s = row.state?.name?.toLowerCase();
          const label =
            s === "approved"
              ? "Aprobado"
              : s === "revoke"
              ? "Anulado"
              : row.state?.name ?? "Desconocido";

          const cls =
            s === "approved"
              ? "text-green-600 font-medium"
              : s === "revoke"
              ? "text-red-600 font-medium"
              : "text-gray-500 font-medium";

          return <span className={cls}>{label}</span>;
        },
      },
    ],
    []
  );

  const buildSearchablePurchases = (purchases: IPurchase[]) => {
    return purchases.map((purchase) => ({
      ...purchase,
      supplierName: purchase.supplier?.name ?? "",
    }));
  };

  const purchasesForSearch = useMemo(
    () => buildSearchablePurchases(purchases),
    [purchases]
  );

  // Memorizar las funciones de callback con dependencias específicas
  const handleCreate = useCallback(() => {
    resetForm();
    setRegisterModalOpen(true);
  }, [resetForm]);

  const handleView = useCallback((row: IPurchase) => {
    setSelectedPurchase(row);
    setDetailModalOpen(true);
  }, []);

  console.log("purchases:", purchases);

  const searchableKeys = useMemo(
    () => [
      "numberoforder",
      "reference",
      "supplierName",
      "createdat",
      "amount",
      "state",
    ],
    []
  );

  const confirmCancelPurchase = useCallback(
    async (purchase: IPurchase) => {
      if (purchase.state?.name?.toLowerCase() === "revoke") {
        Swal.fire({
          icon: "info",
          title: "Compra ya anulada",
          text: `La compra #${purchase.numberoforder} ya está anulada.`,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      const { value: observation, isConfirmed } = await Swal.fire({
        html: `
        <div class="flex flex-col items-center">
          <div class="text-red-600 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20" fill="none" 
                viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 
                1.732-3L13.732 4a2 2 0 00-3.464 0L3.34 
                16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 class="text-xl font-semibold mb-2">¿Está seguro?</h2>

          <p class="text-gray-700 mb-1">
            ¿Desea anular la compra #${purchase.numberoforder}?
          </p>

          <p class="text-gray-500 text-sm mb-3">
            Puedes agregar una observación (opcional)
          </p>

          <textarea id="obs" class="w-full p-2 border rounded resize-none" 
            rows="3" placeholder="Escribe una observación (opcional)..."></textarea>
        </div>
      `,
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
        focusConfirm: false,
        preConfirm: () => {
          const obs = (
            document.getElementById("obs") as HTMLTextAreaElement
          )?.value.trim();
          return obs || undefined;
        },

        customClass: {
          popup: "rounded-2xl p-6",
          confirmButton:
            "bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition",
          cancelButton:
            "bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition mr-3",
        },

        buttonsStyling: false,
        width: "420px",
      });

      if (!isConfirmed) return;

      setIsCancelling(purchase.purchaseorderid);
      showLoader();

      try {
        await handleCancelPurchase(purchase.purchaseorderid, observation);

        Swal.fire({
          icon: "success",
          title: "¡Anulado!",
          text: `La compra #${purchase.numberoforder} ha sido anulada correctamente.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo anular la compra. Intenta nuevamente.",
        });
      } finally {
        setTimeout(() => {
          hideLoader();
          setIsCancelling(null);
        }, 400);
      }
    },
    [handleCancelPurchase, showLoader, hideLoader]
  );

  const isCancelDisabled = useCallback((row: IPurchase) => {
    return row.state?.name?.toLowerCase() === "revoke";
  }, []);

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      hideLoader();
      initialLoadDone.current = false;
      dataLoaded.current = false;
    };
  }, [hideLoader]);

  // Memorizar el DataTable con dependencias estrictas
  const memoizedDataTable = useMemo(() => {
    return (
      <DataTable
        module="purchases"
        data={purchasesForSearch}
        columns={columns}
        searchableKeys={searchableKeys}
        pageSize={8}
        onCancel={confirmCancelPurchase}
        onCreate={handleCreate}
        onView={handleView}
        createButtonText="Registrar compra"
        isCancelDisabled={isCancelDisabled}
        disabled={isCancelling !== null}
        freeze={isRegisterModalOpen || isDetailModalOpen}
      />
    );
  }, [purchases]);

  return (
    <RequireAuth>
      <div className="p-6">
        <ToastContainer position="bottom-right" />
        <h1 className="text-xl font-semibold mb-4">Listado de Compras</h1>

        {/* Renderizar DataTable memoizado */}
        {(!loading || purchases.length > 0) && memoizedDataTable}

        {/* Mostrar skeleton/placeholder mientras carga */}
        {loading && purchases.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          </div>
        )}

        <Modal
          title="Registrar compra"
          isOpen={isRegisterModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          footer={null}
          widthClass="md:max-w-6xl"
        >
          <RegisterPurchaseForm
            onClose={() => setRegisterModalOpen(false)}
            onSave={handleAddPurchase}
            purchases={purchases}
            form={form}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            quantity={quantity}
            setQuantity={setQuantity}
            cart={cart}
            total={total}
            handleChange={handleChange}
            handleAddProduct={handleAddProduct}
            products={products}
            suppliers={suppliers}
            removeFromCart={removeFromCart}
            fetchPurchases={fetchPurchases}
          />
        </Modal>

        <Modal
          title="Detalle de compra"
          isOpen={isDetailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          widthClass="md:max-w-6xl"
          footer={
            <button
              onClick={() => setDetailModalOpen(false)}
              className="cursor-pointer px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-200"
            >
              Cerrar
            </button>
          }
        >
          {selectedPurchase && <ViewPurchase purchase={selectedPurchase} />}
        </Modal>
      </div>
    </RequireAuth>
  );
}
