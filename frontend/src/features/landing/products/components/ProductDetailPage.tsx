"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowLeft, FaShoppingCart } from "react-icons/fa";

import Nav from "../../layout/Nav";
import Footer from "../../layout/Footer";
import { useCart } from "../../contexts/CartContext";

import type { Product } from "../hooks/useProducts";
import { getLandingProductById } from "../api/products.api";

import { showSuccess, showError } from "@/shared/utils/notifications";

const DEFAULT_IMG = "/assets/imgs/default-product.png";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params as any)?.id as string;

  const { addToCart, cart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setError(null);
        setProduct(null);

        const p = await getLandingProductById(id);

        if (!alive) return;
        setProduct(p);
        setActiveIdx(0);
        setQty(1);
      } catch (e: any) {
        console.error(e);
        if (!alive) return;
        setError(e?.message ?? "Error cargando el producto.");
      }
    };

    if (id) load();

    return () => {
      alive = false;
    };
  }, [id]);

  const allImages = useMemo(() => {
    if (!product) return [];
    const main = product.image ? [product.image] : [];
    const extra = Array.isArray((product as any).images)
      ? ((product as any).images as string[])
      : [];
    return Array.from(new Set([...main, ...extra])).filter(Boolean);
  }, [product]);

  const stock = Number(product?.stock ?? 0);

  // ✅ Cantidad actual de este producto que ya está en el carrito
  const qtyInCart = useMemo(() => {
    if (!product) return 0;
    const existing = cart.find((p) => String(p.id) === String(product.id));
    return existing?.quantity ?? 0;
  }, [cart, product]);

  // ✅ Disponible "para agregar" según el carrito actual (no cambia estado del producto)
  const remaining = Math.max(0, stock - qtyInCart);

  // ❗ Mantener estado real del inventario (BD), como pediste
  const inStock = stock > 0;

  const activeImage = allImages[activeIdx] || product?.image || DEFAULT_IMG;

  const clampQty = (next: number) => {
    if (!inStock) return 1;

    // ✅ No dejar seleccionar más de lo que queda disponible considerando carrito
    const max = Math.max(1, remaining || 1);
    const safe = Number.isFinite(next) ? next : 1;
    return Math.min(Math.max(1, safe), max);
  };

  const handleAddToCart = () => {
    if (!product?.price || product.price <= 0) return;

    if (!inStock) {
      showError("Producto agotado.", { toastId: `out-${product.id}` });
      return;
    }

    // ✅ Validación: lo que ya hay en carrito + lo que quiere agregar NO puede superar el stock real
    if (qtyInCart + qty > stock) {
      showError(`No puedes agregar más. Stock disponible: ${stock}`, {
        toastId: `stock-limit-${product.id}`,
      });
      return;
    }

    for (let i = 0; i < qty; i++) {
      addToCart({
        id: product.id,
        name: product.title,
        price: product.price,
        image: activeImage,
        stock,
      });
    }

    showSuccess("Producto agregado al carrito", { toastId: `add-${product.id}` });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {error && (
            <div className="py-10 text-center">
              <p className="text-base font-semibold text-gray-900">
                No se pudo cargar el producto
              </p>
              <p className="text-gray-600 mt-2">{error}</p>
            </div>
          )}

          {!error && !product && (
            <div className="py-10 text-center text-gray-700">
              Cargando producto...
            </div>
          )}

          {!error && product && (
            <>
              <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
                <nav className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                  <span>Inicio</span>
                  <span className="text-gray-400">/</span>
                  <span>Productos</span>
                  <span className="text-gray-400">/</span>
                  <span className="font-semibold text-gray-800">
                    {product.category}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600 line-clamp-1 max-w-[45ch]">
                    {product.title}
                  </span>
                </nav>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition active:scale-[0.99]"
                >
                  <FaArrowLeft className="text-sm" />
                  Volver
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start font-montserrat">
                <section className="w-full">
                  <div
                    className="aspect-[4/3] bg-white rounded-2xl shadow-md overflow-hidden flex items-center justify-center bg-center bg-contain bg-no-repeat"
                    style={{
                      backgroundImage: activeImage
                        ? `url(${activeImage})`
                        : "none",
                    }}
                  >
                    {!activeImage && (
                      <span className="text-gray-400 text-sm">Sin imagen</span>
                    )}
                  </div>

                  {allImages.length > 1 && (
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                      {allImages.slice(0, 10).map((img, idx) => (
                        <button
                          key={`${img}-${idx}`}
                          type="button"
                          onClick={() => setActiveIdx(idx)}
                          className={[
                            "shrink-0 rounded-xl border overflow-hidden bg-white transition",
                            idx === activeIdx
                              ? "ring-2 ring-[#B20000] border-transparent"
                              : "border-gray-200 hover:ring-2 hover:ring-gray-300",
                          ].join(" ")}
                          style={{ width: 74, height: 74 }}
                          aria-label={`Imagen ${idx + 1}`}
                        >
                          <div
                            className="w-full h-full bg-center bg-contain bg-no-repeat"
                            style={{ backgroundImage: `url(${img})` }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="w-full">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight">
                    {product.title}
                  </h1>

                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-[#B20000]">
                      {product.category}
                    </span>

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        inStock
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {inStock ? "Disponible" : "Agotado"}
                    </span>

                    {inStock && (
                      <span className="text-gray-600 text-sm">
                        <strong>Unidades disponibles:</strong> {stock}
                      </span>
                    )}
                  </div>

                  {product.price !== undefined && (
                    <div className="mt-4">
                      <span className="block text-2xl sm:text-3xl font-extrabold text-[#B20000]">
                        ${product.price.toLocaleString("es-CO")}
                      </span>
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-3 flex-wrap">
                    <div
                      className={[
                        "flex items-center gap-2 bg-white rounded-full shadow-md px-3 py-2",
                        !inStock ? "opacity-60" : "",
                      ].join(" ")}
                      aria-disabled={!inStock}
                    >
                      <span className="text-sm font-semibold text-gray-700">
                        Cantidad:
                      </span>

                      <button
                        type="button"
                        className="w-8 h-8 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed"
                        onClick={() => setQty((q) => clampQty(q - 1))}
                        disabled={!inStock}
                        aria-label="Disminuir"
                      >
                        −
                      </button>

                      <input
                        className="w-12 text-center text-sm font-semibold text-gray-800 bg-transparent outline-none"
                        value={qty}
                        onChange={(e) =>
                          setQty(clampQty(Number(e.target.value || 1)))
                        }
                        inputMode="numeric"
                        disabled={!inStock}
                        aria-label="Cantidad"
                      />

                      <button
                        type="button"
                        className="w-8 h-8 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed"
                        onClick={() => setQty((q) => clampQty(q + 1))}
                        disabled={!inStock || qty >= remaining} // ✅ se bloquea por límite real
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                    </div>

                    <motion.button
                      className="bg-[#B20000] text-white rounded-full px-6 py-3 text-sm font-semibold flex items-center justify-center gap-3 shadow-lg hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      whileHover={inStock ? { scale: 1.03 } : {}}
                      whileTap={inStock ? { scale: 0.97 } : {}}
                      onClick={handleAddToCart}
                      disabled={!inStock} // ✅ solo stock real 0 lo deshabilita
                      type="button"
                    >
                      <FaShoppingCart />
                      {inStock ? "Agregar al carrito" : "Sin stock"}
                    </motion.button>
                  </div>

                  <div className="mt-10">
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-800">
                      Descripción
                    </h2>

                    <div className="mt-3 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {product.description}
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}