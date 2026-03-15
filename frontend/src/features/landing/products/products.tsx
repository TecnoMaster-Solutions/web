"use client";

import React, { useEffect, useMemo, useState } from "react";
import Nav from "../layout/Nav";
import Footer from "../layout/Footer";
import Banner from "./components/Banner";
import LayoutProductos from "./components/LayoutProductos";
import FilterBar from "./components/FilterBar";
import SearchBar from "./components/SearchBar";
import CardProducts from "./components/CardProducts";
import Pagination from "./components/Pagination";
import { useProducts, Product } from "./hooks/useProducts";
import {
  fetchLandingProducts,
  fetchLandingProductCategories,
  ProductFilterItem,
} from "./api/products.api";
import { useDebounce } from "./hooks/useDebounce";
import { useCart } from "../contexts/CartContext";
import { showSuccess, showError } from "@/shared/utils/notifications";

export default function ProductsLanding() {
  const { selectedFilters, handleToggleFilter, searchTerm, setSearchTerm } =
    useProducts();

  const { addToCart, cart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductFilterItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 400);
  const itemsPerPage = 9;

const selectedCategory = useMemo(() => {
  const val = selectedFilters.find((f) => f !== "all");
  const parsed = Number(val);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}, [selectedFilters]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await fetchLandingProductCategories();
        setCategories(result);
      } catch (error) {
        console.error("Error cargando categorías:", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchLandingProducts({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch.trim() || undefined,
          categoryid: selectedCategory,
        });

        setProducts(res.data);
        setTotalPages(res.meta.totalPages);
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProducts([]);
        setTotalPages(1);
      }
    };

    load();
  }, [currentPage, debouncedSearch, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    const stock = Number(product.stock ?? 0);

    if (stock <= 0) {
      showError("Producto agotado.");
      return;
    }

    const itemInCart = cart.find(
      (item) => String(item.id) === String(product.id)
    );
    const qtyInCart = itemInCart?.quantity ?? 0;

    if (qtyInCart >= stock) {
      showError(`No puedes agregar más. Stock disponible: ${stock}`);
      return;
    }

    addToCart({
      id: product.id,
      name: product.title,
      price: product.price ?? 0,
      stock,
      image: product.image || "/assets/imgs/default-product.png",
    });

    showSuccess("Producto agregado al carrito");
  };

  return (
    <>
      <Nav />
      <Banner />

      <LayoutProductos>
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <FilterBar
            selectedFilters={selectedFilters}
            handleToggle={handleToggleFilter}
            categories={categories}
          />

          <div className="flex-1 flex flex-col gap-6">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
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

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </div>
      </LayoutProductos>

      <Footer />
    </>
  );
}
