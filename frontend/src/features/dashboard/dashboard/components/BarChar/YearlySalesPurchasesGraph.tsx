"use client";

import React from "react";
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import Colors from "@/shared/theme/colors";
import { getMonthLabelFromNumber, getMonthNumberFromLabel, MonthSelection, MONTH_LABELS_ES } from "./monthUtils";
import { formatCOP } from "../../indexDashboard";

interface YearlySalesPurchasesGraphProps {
  salesData: { month: string; total: number }[];
  purchasesData: { month: string; total: number }[];
  onMonthClick: (month: MonthSelection) => void;
  isCurrency?: boolean;
}

const buildCombinedData = (
  salesData: { month: string; total: number }[],
  purchasesData: { month: string; total: number }[]
) =>
  MONTH_LABELS_ES.map((label, index) => {
    const monthNumber = index + 1;
    const sales = salesData
      .filter((item) => getMonthNumberFromLabel(item.month) === monthNumber)
      .reduce((acc, item) => acc + (Number(item.total) || 0), 0);
    const purchases = purchasesData
      .filter((item) => getMonthNumberFromLabel(item.month) === monthNumber)
      .reduce((acc, item) => acc + (Number(item.total) || 0), 0);

    return {
      month: getMonthLabelFromNumber(monthNumber),
      sales,
      purchases,
    };
  });

const CustomTooltip = ({ active, payload, isCurrency }: any) => {
  if (active && payload && payload.length) {
    const monthLabel = payload[0]?.payload?.month ?? "";
    const salesValue = payload.find((item: any) => item.dataKey === "sales")?.value ?? 0;
    const purchasesValue = payload.find((item: any) => item.dataKey === "purchases")?.value ?? 0;

    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800">{`Mes: ${monthLabel}`}</p>
        <p className="text-gray-600">{`Ventas: ${isCurrency ? formatCOP(salesValue) : salesValue}`}</p>
        <p className="text-gray-600">{`Compras: ${isCurrency ? formatCOP(purchasesValue) : purchasesValue}`}</p>
      </div>
    );
  }
  return null;
};

export const YearlySalesPurchasesGraph = ({
  salesData,
  purchasesData,
  onMonthClick,
  isCurrency = true,
}: YearlySalesPurchasesGraphProps) => {
  const combinedData = buildCombinedData(salesData, purchasesData);
  const maxValue = Math.max(
    0,
    ...combinedData.map((item) => Math.max(item.sales ?? 0, item.purchases ?? 0))
  );

  const handleBarClick = (entry: any) => {
    if (!entry?.payload?.month) return;
    const monthValue = getMonthNumberFromLabel(entry.payload.month);
    onMonthClick({
      label: entry.payload.month,
      value: monthValue,
    });
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={combinedData} margin={{ top: 10, right: 30, left: 32, bottom: 10 }}>
        <XAxis dataKey="month" axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip isCurrency={isCurrency} />} />

        <ReferenceLine
          y={maxValue * 1.05}
          stroke={Colors.graphic.lineMax}
          strokeDasharray="5 5"
          strokeWidth={2}
          label={{
            value: isCurrency ? `MAX ${formatCOP(maxValue)}` : `MAX ${maxValue}`,
            position: "right",
            fill: Colors.texts.primary,
            dx: -4,
            style: { fontSize: 12, fontWeight: "bold" },
          }}
        />

        <Bar
          dataKey="sales"
          name="Ventas"
          fill={Colors.graphic.linePrimary}
          radius={[8, 8, 0, 0]}
          activeBar={<Rectangle fill={Colors.graphic.linePrimary} stroke="purple" />}
          onClick={handleBarClick}
        />
        <Bar
          dataKey="purchases"
          name="Compras"
          fill="#9CA3AF"
          radius={[8, 8, 0, 0]}
          activeBar={<Rectangle fill="#9CA3AF" stroke="purple" />}
          onClick={handleBarClick}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
