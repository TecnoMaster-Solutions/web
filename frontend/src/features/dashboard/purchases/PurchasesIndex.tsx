"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useRouter, useSearchParams } from "next/navigation";
import { showSuccess } from "@/shared/utils/notifications";
import RequireAuth from "../../auth/requireauth";
import { DataTable } from "../components/datatable/DataTable";
import { Column } from "../components/datatable/types/column.types";
import { usePurchases } from "./hooks/usePurchases";
import { IPurchase } from "./Types/Purchase.type";
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PurchasesIndex() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const purchasesHook = usePurchases();
  const { fetchPurchases } = purchasesHook;

  const { purchases, loading, saving, handleCancelPurchase } = purchasesHook;

  const [isCancelling, setIsCancelling] = useState<number | null>(null);

  const overlayLoading = loading || saving;

  const createdToastShown = useRef(false);
  const cancelledToastShown = useRef(false);

  useEffect(() => {
    const created = searchParams.get("created");
    const cancelled = searchParams.get("cancelled");
    const cancelledOrder = searchParams.get("order");

    if (created === "1" && !createdToastShown.current) {
      createdToastShown.current = true;

      showSuccess("Compra registrada con éxito.", { autoClose: 5000 });

      const params = new URLSearchParams(window.location.search);
      params.delete("created");
      const newUrl =
        params.toString().length > 0
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;

      window.history.replaceState({}, "", newUrl);
    }

    if (cancelled === "1" && !cancelledToastShown.current) {
      cancelledToastShown.current = true;

      showSuccess(
        cancelledOrder
          ? `Compra ${cancelledOrder} anulada correctamente.`
          : "Compra anulada correctamente.",
        { autoClose: 5000 }
      );

      const params = new URLSearchParams(window.location.search);
      params.delete("cancelled");
      params.delete("order");
      const newUrl =
        params.toString().length > 0
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;

      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchPurchases();
    }
  }, [fetchPurchases]);

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

          const isApproved = s === "approved";
          const isRevoked = s === "revoke"; // anulado/inactivo

          const label = isApproved
            ? "Aprobado"
            : isRevoked
            ? "Anulado"
            : row.state?.name ?? "Desconocido";

          // ✅ Aprobado en verde, Anulado en rojo
          const cls = isApproved
            ? "text-green-600 font-medium"
            : isRevoked
            ? "text-red-600 font-medium"
            : "text-gray-500 font-medium";

          return <span className={cls}>{label}</span>;
        },
      },
    ],
    []
  );

  const buildSearchablePurchases = (items: IPurchase[]) => {
    return items.map((purchase) => ({
      ...purchase,
      supplierName: purchase.supplier?.name ?? "",
    }));
  };

  const purchasesForSearch = useMemo(
    () => buildSearchablePurchases(purchases),
    [purchases]
  );

  const handleCreate = useCallback(() => {
    router.push("/dashboard/purchases/create");
  }, [router]);

  const handleView = useCallback(
    (row: IPurchase) => {
      router.push(`/dashboard/purchases/${row.purchaseorderid}`);
    },
    [router]
  );

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
      // ✅ Si ya está anulado, no permitir y mostrar info
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
            <div class="text-green-600 mb-3">
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
            "bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition",
          cancelButton:
            "bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition mr-3",
        },
        buttonsStyling: false,
        width: "420px",
      });

      if (!isConfirmed) return;

      setIsCancelling(purchase.purchaseorderid);

      try {
        await handleCancelPurchase(purchase.purchaseorderid, observation);

        cancelledToastShown.current = false;
        setIsCancelling(null);

        router.push(
          `/dashboard/purchases?cancelled=1&order=${encodeURIComponent(
            purchase.numberoforder
          )}`
        );
      } catch (error) {
        setIsCancelling(null);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo anular la compra. Intenta nuevamente.",
        });
      }
    },
    [handleCancelPurchase, router]
  );

  // ✅ Deshabilitar botón "Anular" si ya está anulado
  const isCancelDisabled = useCallback((row: IPurchase) => {
    return row.state?.name?.toLowerCase() === "revoke";
  }, []);

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
        freeze={false}
      />
    );
  }, [
    purchasesForSearch,
    columns,
    searchableKeys,
    confirmCancelPurchase,
    handleCreate,
    handleView,
    isCancelDisabled,
    isCancelling,
  ]);

  return (
    <RequireAuth>
      <ToastContainer position="bottom-right" />

      <div className="p-6">
        <FullScreenLoader show={overlayLoading} />

        {(!loading || purchases.length > 0) && memoizedDataTable}

        {loading && purchases.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}