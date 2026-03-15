"use client";

import { useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import RequireAuth from "@/features/auth/requireauth";
import RegisterPurchaseForm from "../components/RegisterPurchase";
import { type PurchaseFormState, usePurchases } from "../hooks/usePurchases";
import FullScreenLoader from "@/shared/components/FullScreenLoader";

type PurchasesHookReturn = ReturnType<typeof usePurchases> & {
  form: PurchaseFormState;
};

export default function PurchasesCreatePage() {
  const router = useRouter();
  const purchasesHook = usePurchases();

const {
  handleAddPurchase,
  purchases,
  fetchPurchases,
  form,

  selectedProduct,
  setSelectedProduct,

  quantity,
  setQuantity,

  purchasePrice,
  setPurchasePrice,

  salePrice,
  setSalePrice,

  cart,
  totalAmount,

  removeFromCart,
  updateCartItem,

  handleChange,
  addToCart,

  products,
  suppliers,

  purchaseOrders,
  poLoading,

  saving,

  poDetailLoading,
  isUsingPurchaseOrder,
} = purchasesHook as PurchasesHookReturn;

  const refetchPurchases = () => fetchPurchases(1, 5, "");

  const handleBack = () => {
    try {
      router.back();
      setTimeout(() => router.push("/dashboard/purchases"), 250);
    } catch {
      router.push("/dashboard/purchases");
    }
  };

  return (
    <RequireAuth>
      <ToastContainer position="bottom-right" />

      <FullScreenLoader show={saving} />

      <div className="p-6">
        <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Registrar compra
            </h1>
            <p className="text-sm text-gray-500">
              Completa los campos y agrega productos al carrito.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
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

        <RegisterPurchaseForm
          onSave={handleAddPurchase}
          onClose={(created?: boolean) => {
            router.push(
              created ? "/dashboard/purchases?created=1" : "/dashboard/purchases"
            );
          }}
          purchases={purchases}
          fetchPurchases={refetchPurchases}
          form={form}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          quantity={quantity}
          setQuantity={setQuantity}
          purchasePrice={purchasePrice}
          setPurchasePrice={setPurchasePrice}
          salePrice={salePrice}
          setSalePrice={setSalePrice}
          cart={cart}
          total={totalAmount}
          removeFromCart={removeFromCart}
          updateCartItem={updateCartItem}
          handleChange={handleChange}
          addToCart={addToCart}
          products={products}
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          poLoading={poLoading}
          poDetailLoading={!!poDetailLoading}
          isUsingPurchaseOrder={!!isUsingPurchaseOrder}
        />
      </div>
    </RequireAuth>
  );
}
