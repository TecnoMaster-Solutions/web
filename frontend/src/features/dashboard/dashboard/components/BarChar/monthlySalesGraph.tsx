"use client";

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import Image from "next/image";
import Colors from "@/shared/theme/colors";
import { dashboardApi } from "../../api/dashboardApi";
import { formatCOP } from "../../indexDashboard"
import { getMonthNumberFromLabel } from "./monthUtils";

interface MonthlyGraphProps {
  title: string;
  month: string;
  monthNumber?: number;
  data: { month: string; total: number }[];
  onBack: () => void;
  isCurrency?: boolean;
  year?: number;
}

export const MonthlyGraph = ({
  title,
  month,
  monthNumber,
  data,
  onBack,
  isCurrency = true,
  year,
}: MonthlyGraphProps) => {
  const [dailyData, setDailyData] = useState<{ day: number; total: number }[]>([]);
  const isClientsChart = title === "Clientes";
  const resolvedMonthNumber = getMonthNumberFromLabel(monthNumber ?? month);


  // Total del mes (para mostrar en el título)
  const rawTotal = data
    .filter((item) => getMonthNumberFromLabel(item.month) === resolvedMonthNumber)
    .reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  const displayTotal = isClientsChart ? Math.max(0, Math.round(rawTotal)) : rawTotal;

  // CARGAR DATOS DIARIOS DESDE BACKEND
  useEffect(() => {
    const requestedMonth = resolvedMonthNumber;

    const requestedYear = year;
    let cancelled = false;

    const loadDailyData = async () => {
      if (!requestedMonth) {
        setDailyData([]);
        return;
      }
      try {
        let apiFunction: any = null;

        if (title === "Ventas") apiFunction = dashboardApi.getDailySalesByMonth;
        if (title === "Compras") apiFunction = dashboardApi.getDailyPurchasesByMonth;
        if (title === "Clientes") apiFunction = dashboardApi.getDailyClientsByMonth;

        if (!apiFunction) return;

        const response = await apiFunction(requestedMonth, requestedYear);

        if (cancelled) return;

        setDailyData([]); // Clear the data before setting new data

        const sanitizedResponse = isClientsChart
          ? response.map((item: { day: number; total: number }) => ({
            ...item,
            total: Math.max(0, Math.round(item.total)),
          }))
          : response;

        sanitizedResponse.sort((a: any, b: any) => (a.day ?? 0) - (b.day ?? 0));

        if (cancelled) return;
        setDailyData(sanitizedResponse);
      } catch (error) {
        if (cancelled) return;
        console.error("Error cargando datos diarios:", error);
      }
    };

    loadDailyData();

    return () => {
      cancelled = true;
    };
  }, [month, title, resolvedMonthNumber, isClientsChart, year]);


  // Formato del eje Y
  const formatYAxisTick = (value: number) => {
    if (isClientsChart) return Math.max(0, Math.round(value)).toString();
    return isCurrency ? formatCOP(value) : value.toString();
  };


  // Formato del tooltip
  const formatTooltipValue = (value: number) => {
    const sanitizedValue = isClientsChart ? Math.max(0, Math.round(value)) : value;
    return isCurrency ? formatCOP(sanitizedValue) : sanitizedValue;
  };


  return (
    <div className="w-full h-full flex flex-col items-center">
      {/* Header del gráfico */}
      <div className="w-full flex justify-between items-center px-4">
        <h2 className="text-lg font-bold">
          {title} {month}: {isCurrency ? formatCOP(displayTotal) : displayTotal}
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

      {/* Gráfico diario */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={dailyData}
          margin={{ top: 10, right: 20, left: 32, bottom: 20 }}
        >
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
            allowDecimals={!isClientsChart}
            domain={isClientsChart ? [0, "dataMax"] : undefined}
          />

          <Tooltip
            formatter={(value) => [formatTooltipValue(Number(value)), "Total"]}
            labelFormatter={(label) => `Día ${label}`}
          />


          <Line
            type="monotone"
            dataKey="total"
            stroke={Colors.graphic.linePrimary}
            strokeWidth={3}
            dot
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
