"use client";

import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useProducts } from "./hooks/useProducts";
import ProductsTable from "./components/ProductsTable";
import CreateProductModal from "./components/CreateProductModal/CreateProductModal";
import EditProductModal from "./components/EditProductModal/EditProductModal";
import ViewProductModal from "./components/ViewProductModal/ViewProductModal";
import type { Product } from "./types/typesProducts";

export default function ProductsIndex() {
  const {
    products,
    loading,

    isCreateModalOpen,
    setIsCreateModalOpen,

    isEditModalOpen,
    editingProduct,
    setEditingProduct,

    handleCreateProduct,
    handleEditProduct,
    handleDelete,
  } = useProducts();

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen flex">
      <ToastContainer position="bottom-right" />

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[99999]">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col">
          <div className="px-6 pt-6">
            <CreateProductModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSave={handleCreateProduct}
              products={products}
            />

            <EditProductModal
              isOpen={isEditModalOpen}
              product={editingProduct}
              onClose={() => setEditingProduct(null)}
              onSave={(data) => handleEditProduct(data.id, data)}
              products={products}
            />

            <ViewProductModal
              isOpen={!!viewingProduct}
              product={viewingProduct}
              onClose={() => setViewingProduct(null)}
            />

            <ProductsTable
              products={products}
              onView={(p) => setViewingProduct(p)}
              onEdit={(p) => setEditingProduct(p)}
              onDelete={handleDelete}
              onCreate={() => setIsCreateModalOpen(true)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}