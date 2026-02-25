"use client";

import { IPurchase } from "../Types/Purchase.type";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

type ViewPurchaseProps = {
  purchase: IPurchase;
};

export default function ViewPurchase({ purchase }: ViewPurchaseProps) {
  const [openProducts, setOpenProducts] = useState<Set<number>>(new Set());

  const products = purchase.purchaseProducts ?? [];

  return (
    <div className="space-y-6 pr-2">
      {/* ----------------------- INFO GENERAL ----------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ID Compra" value={String(purchase.purchaseorderid)} />

        <Field label="N° Orden" value={purchase.numberoforder} />

        <Field label="N° Factura" value={purchase.reference} />

        <Field
          label="Estado"
          value={
            purchase.state?.name?.toLowerCase() === "approved"
              ? "Aprobada"
              : purchase.state?.name?.toLowerCase() === "revoke"
              ? "Anulada"
              : "Desconocido"
          }
        />

        <Field
          label="Fecha Registro"
          value={new Date(purchase.createdat).toLocaleDateString()}
        />

        <Field
          label="Fecha Actualización"
          value={new Date(purchase.updatedat).toLocaleDateString()}
        />

        <Field
          label="Monto total"
          value={Number(purchase.amount).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
          })}
        />

        <Field
          label="Observación"
          value={purchase.observation || "Sin observación"}
        />
      </div>

      {/* ----------------------- PROVEEDOR ----------------------- */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Proveedor</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre" value={purchase.supplier?.name ?? ""} />
          <Field label="NIT" value={purchase.supplier?.nit ?? ""} />
          <Field label="Teléfono" value={purchase.supplier?.phone ?? ""} />
          <Field label="Email" value={purchase.supplier?.email ?? ""} />
          <Field label="Dirección" value={purchase.supplier?.address ?? ""} />
          <Field
            label="Persona de Contacto"
            value={purchase.supplier?.contactname ?? ""}
          />
        </div>
      </div>

      {/* ----------------------- PRODUCTOS ----------------------- */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Productos</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {products.map((item) => {
              const product = item.product;
              const isOpen = openProducts.has(item.purchaseProductId);

              return (
                <motion.div
                  key={item.purchaseProductId}
                  whileHover={{
                    boxShadow: "0px 10px 25px rgba(139, 0, 0, 0.5)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  layout
                  transition={{ duration: 0.3 }}
                  className={`cursor-pointer bg-gray-50 rounded-xl shadow-md p-4 
                    ${
                      isOpen
                        ? "flex flex-col gap-4 md:col-span-2 xl:col-span-3"
                        : "flex flex-col items-center"
                    }`}
                  onClick={() => {
                    setOpenProducts((prev) => {
                      const newSet = new Set(prev);
                      newSet.has(item.purchaseProductId)
                        ? newSet.delete(item.purchaseProductId)
                        : newSet.add(item.purchaseProductId);
                      return newSet;
                    });
                  }}
                >
                  {/* Vista compacta */}
                  <div className="flex flex-col items-center w-full">
                    <p className="mt-2 font-medium text-gray-800 text-center">
                      {product?.productname ?? "Producto sin nombre"}
                    </p>

                    <Image
                      src={
                        product?.image && product.image.trim() !== ""
                          ? product.image
                          : "https://cdn-icons-png.flaticon.com/512/679/679720.png"
                      }
                      alt={product?.productname ?? "Producto"}
                      width={80}
                      height={80}
                      className="object-contain mt-2 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/imgs/laptop.png";
                      }}
                    />
                  </div>

                  {/* Vista expandida */}
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="w-full overflow-x-auto"
                    >
                      {/* INFO DETALLADA DEL PRODUCTO */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <Field
                          label="ID Producto"
                          value={String(product?.productid)}
                        />
                        <Field
                          label="Precio proveedor"
                          value={Number(
                            product?.productpriceofsupplier
                          ).toLocaleString("es-CO", {
                            style: "currency",
                            currency: "COP",
                          })}
                        />
                        <Field
                          label="Precio venta"
                          value={Number(
                            product?.productpriceofsale
                          ).toLocaleString("es-CO", {
                            style: "currency",
                            currency: "COP",
                          })}
                        />
                        <Field
                          label="Stock actual"
                          value={String(product?.productstock)}
                        />
                        <Field
                          label="Descripción"
                          value={product?.productdescription ?? ""}
                        />
                        <Field
                          label="Código"
                          value={product?.productcode ?? "Sin código"}
                        />
                      </div>

                      {/* TABLA DE PRECIO / CANTIDAD */}
                      <table className="w-full min-w-[350px] border-collapse">
                        <thead>
                          <tr>
                            <th className="p-2 text-center">Precio Unit.</th>
                            <th className="p-2 text-center">Cantidad</th>
                            <th className="p-2 text-center">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2 text-center">
                              {Number(item.unitprice).toLocaleString("es-CO", {
                                style: "currency",
                                currency: "COP",
                              })}
                            </td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-center">
                              {Number(item.subtotal).toLocaleString("es-CO", {
                                style: "currency",
                                currency: "COP",
                              })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**  FIELD COMPONENT MEJORADO */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600">{label}</label>
      <input
        type="text"
        value={value}
        disabled
        className="w-full border p-2 rounded-lg bg-gray-100 text-gray-900"
      />
    </div>
  );
}
