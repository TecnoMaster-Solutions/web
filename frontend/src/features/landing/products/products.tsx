"use client";

import React, { useState } from "react";
import Nav from "../layout/Nav";
import Footer from "../layout/Footer";
import Banner from "./components/Banner";
import LayoutProductos from "./components/LayoutProductos";
import FilterBar from "./components/FilterBar";
import SearchBar from "./components/SearchBar";
import CardProducts from "./components/CardProducts";
import Pagination from "./components/Pagination";
import { useProducts, Product } from "./hooks/useProducts";
import CategoryCarousel from "./components/CategoryCarousel";
import { useCart } from "../contexts/CartContext";
import { showSuccess, showError} from "@/shared/utils/notifications";


interface ProductsProps {
  className?: string;
}

export default function ProductsLanding({ className = "" }: ProductsProps) {
  const mockProducts: Product[] = [];

const { addToCart, cart } = useCart();

  const {
    loading,
    selectedFilters,
    handleToggleFilter,
    searchTerm,
    setSearchTerm,
    filteredProducts,
    availableCategories,
  } = useProducts(mockProducts);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

const handleAddToCart = (product: Product) => {
  if ((product.stock ?? 0) <= 0) {
    showError("Producto agotado.");
    return;
  }

  const itemInCart = cart.find((item) => String(item.id) === String(product.id));
  const qtyInCart = itemInCart?.quantity ?? 0;

  if (qtyInCart >= product.stock) {
    showError(`No puedes agregar más. Stock disponible: ${product.stock}`);
    return;
  }

  addToCart({
    id: product.id,
    name: product.title,
    price: product.price ?? 0,
    stock: product.stock,
    image: product.image || "/assets/imgs/default-product.png",
  });

  showSuccess("Producto agregado al carrito");
};

  return (
    <div className={className}>
      <Nav />
      <Banner />

      <LayoutProductos>
        <CategoryCarousel />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <FilterBar
            selectedFilters={selectedFilters}
            handleToggle={handleToggleFilter}
            categories={availableCategories}
            className="w-full lg:w-64 flex-shrink-0"
          />

          <div className="flex-1 flex flex-col gap-6">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-10 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <CardProducts
                    key={product.id}
                    id={String(product.id)}
                    title={product.title}
                    description={product.description}
                    category={product.category}
                    image={product.image}
                    price={product.price}
                    stock={product.stock}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page: number) => setCurrentPage(page)}
              />
            )}
          </div>
        </div>
      </LayoutProductos>

      <Footer />
    </div>
  );
}