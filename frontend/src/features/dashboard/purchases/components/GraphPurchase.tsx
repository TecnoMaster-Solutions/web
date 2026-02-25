"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 📊 Datos por año
const purchaseData: Record<string, { month: string; purchases: number }[]> = {
  2023: [
    { month: "Enero", purchases: 5 },
    { month: "Febrero", purchases: 12 },
    { month: "Marzo", purchases: 18 },
    { month: "Abril", purchases: 25 },
    { month: "Mayo", purchases: 40 },
    { month: "Junio", purchases: 32 },
    { month: "Julio", purchases: 22 },
    { month: "Agosto", purchases: 14 },
    { month: "Septiembre", purchases: 10 },
    { month: "Octubre", purchases: 8 },
    { month: "Noviembre", purchases: 50 },
    { month: "Diciembre", purchases: 15 },
  ],
  2024: [
    { month: "Enero", purchases: 0 },
    { month: "Febrero", purchases: 11 },
    { month: "Marzo", purchases: 20 },
    { month: "Abril", purchases: 30 },
    { month: "Mayo", purchases: 32 },
    { month: "Junio", purchases: 28 },
    { month: "Julio", purchases: 20 },
    { month: "Agosto", purchases: 12 },
    { month: "Septiembre", purchases: 8 },
    { month: "Octubre", purchases: 0 },
    { month: "Noviembre", purchases: 50 },
    { month: "Diciembre", purchases: 0 },
  ],
  2025: [
    { month: "Enero", purchases: 0 },
    { month: "Febrero", purchases: 11 },
    { month: "Marzo", purchases: 20 },
    { month: "Abril", purchases: 30 },
    { month: "Mayo", purchases: 32 },
    { month: "Junio", purchases: 28 },
    { month: "Julio", purchases: 20 },
    { month: "Agosto", purchases: 12 },
    { month: "Septiembre", purchases: 2 },
    { month: "Octubre", purchases: 0 },
    { month: "Noviembre", purchases: 0 },
    { month: "Diciembre", purchases: 0 },
  ],
};

const GraphPurchase: React.FC = () => {
  const [year, setYear] = useState<string>("2024");

  return (
    <div
      style={{
        width: "100%",
        height: 350,
        padding: 20,
        borderRadius: 20,
        position: "relative",
      }}
    >
      {/* Selector de año */}
      <div
        style={{
          position: "absolute",
          top: -10,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: "#ff7171",
            width: 20,
            height: 20,
            borderRadius: "50%",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        />
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#000" }}>
          Compras del año
        </div>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: "10px",
            fontSize: 14,
            fontWeight: 500,
            border: "1px solid #ff7171",
            outline: "none",
            backgroundColor: "#fff",
            color: "#333",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease-in-out",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg fill='%23ff7171' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            backgroundSize: "16px",
            paddingRight: "35px",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)")
          }
        >
          {Object.keys(purchaseData).map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={purchaseData[year]}
          margin={{ top: 50, right: 30, left: 20, bottom: 40 }}
        >
          <defs>
            <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff7171" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ff7171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            interval={0} // 📌 muestra todos los meses
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60} // 📌 más espacio para que no se corten
          />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Area
            name="Compras"
            type="monotone"
            dataKey="purchases"
            stroke="#ff7171"
            fillOpacity={1}
            fill="url(#colorPurchases)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraphPurchase;
