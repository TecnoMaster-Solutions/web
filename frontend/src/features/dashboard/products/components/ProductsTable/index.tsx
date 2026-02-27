"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/features/dashboard/components/datatable/DataTable";
import Colors from "@/shared/theme/colors";
import type { Product } from "@/features/dashboard/products/types/typesProducts";
import DownloadXLSXButton from "../../../components/DownloadXLSXButton";
import type { Column } from "@/features/dashboard/components/datatable/types/column.types";

type ProductRowForXlsx = {
  ID: number;
  Nombre: string;
  Descripción: string;
  Categoría: string;
  "Cat. proveedor": string;
  "Precio proveedor": string;
  "Precio venta": string;
  Stock: number;
  Código: string;
  Estado: string;
};

interface ProductsTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCreate: () => void;
}

type ProductForTable = Product & {
  rowNumber: number;
  stateSearch: "activo" | "inactivo";
  fullSearch: string;
};

const cleanText = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  const lower = s.toLowerCase();
  if (lower === "null" || lower === "undefined") return "—";
  return s;
};

const normalizeText = (v: unknown) => {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

const digitsOnly = (v: unknown) => String(v ?? "").replace(/[^\d]/g, "");

const isActiveState = (v: unknown) => normalizeText(v) === "activo";
const isInactiveState = (v: unknown) => normalizeText(v) === "inactivo";

const Trunc: React.FC<{
  value: unknown;
  max?: number;
  className?: string;
  lines?: 1 | 2;
}> = ({ value, max = 28, className = "", lines = 2 }) => {
  const text = cleanText(value);
  const shown = text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;

  return (
    <span
      className={["block max-w-full min-w-0 overflow-hidden leading-5", className].join(" ")}
      title={text !== "—" ? text : undefined}
      style={{
        whiteSpace: "normal",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical" as any,
        WebkitLineClamp: lines,
        overflow: "hidden",
      }}
    >
      {shown}
    </span>
  );
};

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  onView,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const productsForTable: ProductForTable[] = useMemo(() => {
    const sortedProducts = [...products].sort(
      (a, b) => Number(b.id ?? 0) - Number(a.id ?? 0)
    );

    const total = sortedProducts.length; // <-- ÚNICO EXTRA

    return sortedProducts.map((p, index) => {
      const stateSearch: "activo" | "inactivo" = isActiveState(p.state)
        ? "activo"
        : "inactivo";

      const fullSearchText = [
        p.id,
        p.name,
        p.description,
        p.categoryName,
        p.supplierCategory,
        p.code,
      ]
        .map(normalizeText)
        .join(" ");

      const fullSearchNums = [
        digitsOnly(p.id),
        digitsOnly(p.stock),
        digitsOnly(p.salePrice),
        digitsOnly(p.supplierPrice),
        digitsOnly(p.code),
      ]
        .filter(Boolean)
        .join(" ");

      return {
        ...p,
        rowNumber: total - index, // <-- ÚNICO CAMBIO (antes era index + 1)
        stateSearch,
        fullSearch: `${fullSearchText} ${fullSearchNums}`.trim(),
      };
    });
  }, [products]);

  const columns: Column<ProductForTable>[] = [
    {
      key: "rowNumber",
      header: "#",
      render: (p) => <span className="tabular-nums whitespace-nowrap">{p.rowNumber}</span>,
    },
    {
      key: "name",
      header: "Nombre",
      render: (p) => <Trunc value={p.name} max={26} className="max-w-[220px]" lines={2} />,
    },
    {
      key: "categoryName",
      header: "Categoría",
      render: (p) => <Trunc value={p.categoryName} max={22} className="max-w-[190px]" lines={2} />,
    },
    {
      key: "supplierCategory",
      header: "Cat. proveedor",
      render: (p) => (
        <Trunc value={p.supplierCategory} max={24} className="max-w-[170px]" lines={2} />
      ),
    },
    {
      key: "salePrice",
      header: "Precio",
      render: (p) => (
        <div className="whitespace-nowrap text-right tabular-nums">
          {p.salePrice === null || p.salePrice === undefined
            ? "—"
            : `$${Number(p.salePrice).toLocaleString("es-CO")}`}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (p) => <span className="whitespace-nowrap tabular-nums">{Number(p.stock ?? 0)}</span>,
    },
    {
      key: "image",
      header: "Imagen",
      render: (p) =>
        p.image ? (
          <div className="w-full flex justify-center">
            <img
              src={p.image}
              alt={cleanText(p.name)}
              className="w-10 h-10 object-cover rounded-md border border-gray-200"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <span className="text-gray-400 text-xs italic">Sin imagen</span>
          </div>
        ),
    },
    {
      key: "state",
      header: "Estado",
      render: (p) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
          style={{
            color: p.state === "Activo" ? Colors.states.success : Colors.states.inactive,
          }}
        >
          {p.state}
        </span>
      ),
    },
  ];

  const xlsxRows: ProductRowForXlsx[] = productsForTable.map((p) => ({
    ID: p.id,
    Nombre: cleanText(p.name),
    Descripción: cleanText(p.description),
    Categoría: cleanText(p.categoryName),
    "Cat. proveedor": cleanText(p.supplierCategory),
    "Precio proveedor": Number(p.supplierPrice ?? 0).toLocaleString("es-CO"),
    "Precio venta":
      p.salePrice === null || p.salePrice === undefined
        ? "—"
        : Number(p.salePrice).toLocaleString("es-CO"),
    Stock: Number(p.stock ?? 0),
    Código: cleanText(p.code),
    Estado: p.state,
  }));

  return (
    <div className="w-full min-w-0">
      <DataTable<ProductForTable>
        module="products"
        data={productsForTable}
        columns={columns}
        pageSize={10}
        searchableKeys={[
          "name",
          "categoryName",
          "supplierCategory",
          "code",
          "salePrice",
          "stock",
          "fullSearch",
          "stateSearch",
        ]}
        onView={(p) => onView(p)}
        onEdit={(p) => onEdit(p)}
        onDelete={(p) => onDelete(p)}
        onCreate={onCreate}
        actionGuard={(row) =>
          isInactiveState(row.state)
            ? {
              disableDelete: true,
              deleteTitle: "No se puede eliminar un producto inactivo",
            }
            : {}
        }
        searchPlaceholder="Buscar productos..."
        createButtonText="Crear Producto"
        rightActions={
          <>
            <div className="hidden md:block">
              <DownloadXLSXButton
                id="download-excel-btn"
                data={xlsxRows as unknown as Record<string, unknown>[]}
                fileName="reporte_productos.xlsx"
                headers={[
                  "ID",
                  "Nombre",
                  "Descripción",
                  "Categoría",
                  "Cat. proveedor",
                  "Código",
                  "Precio proveedor",
                  "Precio venta",
                  "Stock",
                  "Estado",
                ]}
              />
            </div>

            <button
              onClick={() =>
                document.querySelector<HTMLButtonElement>("#download-excel-btn")?.click()
              }
              className="fixed bottom-20 right-6 z-50 flex md:hidden items-center justify-center w-12 h-12 rounded-full shadow-lg text-white transition-transform hover:scale-105"
              style={{ background: "#B20000" }}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                />
              </svg>
            </button>
          </>
        }
      />
    </div>
  );
};

export default ProductsTable;