"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Image from "next/image";
import Colors from "@/shared/theme/colors";
import { dashboardApi } from "../../api/dashboardApi";
import { formatCOP } from "../../indexDashboard";
import { getMonthNumberFromLabel } from "./monthUtils";

interface MonthlySalesPurchasesGraphProps {
  month: string;
  monthNumber?: number;
  salesData: { month: string; total: number }[];
  purchasesData: { month: string; total: number }[];
  onBack: () => void;
  isCurrency?: boolean;
  year?: number;
}

type DailyPoint = {
  day: number;
  sales?: number;
  purchases?: number;
};

const mergeDailyData = (
  sales: { day: number; total: number }[],
  purchases: { day: number; total: number }[]
): DailyPoint[] => {
  const byDay = new Map<number, DailyPoint>();

  sales.forEach((item) => {
    const entry = byDay.get(item.day) ?? { day: item.day };
    entry.sales = item.total ?? 0;
    byDay.set(item.day, entry);
  });

  purchases.forEach((item) => {
    const entry = byDay.get(item.day) ?? { day: item.day };
    entry.purchases = item.total ?? 0;
    byDay.set(item.day, entry);
  });

  return Array.from(byDay.values()).sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
};

export const MonthlySalesPurchasesGraph = ({
  month,
  monthNumber,
  salesData,
  purchasesData,
  onBack,
  isCurrency = true,
  year,
}: MonthlySalesPurchasesGraphProps) => {
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);
  const resolvedMonthNumber = getMonthNumberFromLabel(monthNumber ?? month);

  const monthTotals = useMemo(() => {
    const salesTotal = salesData
      .filter((item) => getMonthNumberFromLabel(item.month) === resolvedMonthNumber)
      .reduce((acc, item) => acc + (Number(item.total) || 0), 0);
    const purchasesTotal = purchasesData
      .filter((item) => getMonthNumberFromLabel(item.month) === resolvedMonthNumber)
      .reduce((acc, item) => acc + (Number(item.total) || 0), 0);
    return { salesTotal, purchasesTotal };
  }, [salesData, purchasesData, resolvedMonthNumber]);

  useEffect(() => {
    const requestedMonth = resolvedMonthNumber;
    if (!requestedMonth) {
      setDailyData([]);
      return;
    }

    const requestedYear = year;
    let cancelled = false;

    const loadDailyData = async () => {
      try {
        const [salesResponse, purchasesResponse] = await Promise.all([
          dashboardApi.getDailySalesByMonth(requestedMonth, requestedYear),
          dashboardApi.getDailyPurchasesByMonth(requestedMonth, requestedYear),
        ]);

        if (cancelled) return;

        const sanitizedSales = (salesResponse ?? []).map((item: any) => ({
          day: Number(item.day ?? 0),
          total: Number(item.total ?? 0),
        }));

        const sanitizedPurchases = (purchasesResponse ?? []).map((item: any) => ({
          day: Number(item.day ?? 0),
          total: Number(item.total ?? 0),
        }));

        setDailyData(mergeDailyData(sanitizedSales, sanitizedPurchases));
      } catch (error) {
        if (cancelled) return;
        console.error("Error cargando datos diarios:", error);
        setDailyData([]);
      }
    };

    loadDailyData();

    return () => {
      cancelled = true;
    };
  }, [resolvedMonthNumber, year]);

  const formatYAxisTick = (value: number) => (isCurrency ? formatCOP(value) : value.toString());
  const formatTooltipValue = (value: number) => (isCurrency ? formatCOP(value) : value);

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center px-4">
        <h2 className="text-lg font-bold">
          {month} | Ventas: {formatCOP(monthTotals.salesTotal)} | Compras: {formatCOP(monthTotals.purchasesTotal)}
        </h2>

        <button
          onClick={onBack}
          className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          <Image
            src="/icons/Medium-left.svg"
            alt="Volver"
            width={20}
            height={20}
            className="filter brightness-0"
          />
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dailyData} margin={{ top: 10, right: 20, left: 32, bottom: 20 }}>
          <XAxis
            dataKey="day"
            tick={{ fill: Colors.texts.primary }}
            label={{
              value: "Días del Mes",
              position: "insideBottom",
              offset: -5,
              fill: Colors.texts.primary,
            }}
          />
          <YAxis
            width={90}
            tickFormatter={formatYAxisTick}
            tick={{ fill: Colors.texts.primary }}
            tickMargin={8}
            allowDecimals={!isCurrency}
          />

          <Tooltip
            formatter={(value, name) => [
              formatTooltipValue(Number(value)),
              name === "sales" ? "Ventas" : "Compras",
            ]}
            labelFormatter={(label) => `Día ${label}`}
          />

          <Line
            type="monotone"
            dataKey="sales"
            name="Ventas"
            stroke={Colors.graphic.linePrimary}
            strokeWidth={3}
            dot
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="purchases"
            name="Compras"
            stroke="#9CA3AF"
            strokeWidth={3}
            dot
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
