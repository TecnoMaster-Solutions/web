"use client";

import React from "react";
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import Colors from "@/shared/theme/colors";
import { getMonthLabelFromNumber, getMonthNumberFromLabel, MonthSelection, MONTH_LABELS_ES } from "./monthUtils";
import { formatCOP } from "../../indexDashboard"

interface YearlyGraphProps {
  title: string;
  data: { month: string; total: number }[];
  onMonthClick: (month: MonthSelection) => void;
  isCurrency?: boolean;
}

// Componente Tooltip personalizado
const CustomTooltip = ({ active, payload, isCurrency }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const displayValue = isCurrency ? formatCOP(value) : value;

    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800">{`Mes: ${payload[0].payload.month}`}</p>
        <p className="text-gray-600">{`Total: ${displayValue}`}</p>
      </div>
    );
  }
  return null;
};

export const YearlyGraph = ({ title, data, onMonthClick, isCurrency = true }: YearlyGraphProps) => {
  const normalizedData = MONTH_LABELS_ES.map((label, index) => {
    const monthNumber = index + 1;
    const total = data
      .filter((item) => getMonthNumberFromLabel(item.month) === monthNumber)
      .reduce((acc, item) => acc + (Number(item.total) || 0), 0);

    return {
      month: getMonthLabelFromNumber(monthNumber),
      total,
    };
  });

  const maxValue = Math.max(0, ...normalizedData.map((item) => item.total));

  const handleBarClick = (entry: any) => {
    if (!entry) return;
    const monthValue = getMonthNumberFromLabel(entry.month);
    onMonthClick({
      label: entry.month,
      value: monthValue,
    });
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={normalizedData}
        margin={{ top: 10, right: 30, left: 32, bottom: 10 }}
      >
        <XAxis dataKey="month" axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip isCurrency={isCurrency} />} />

        {/* Línea de referencia al valor máximo */}
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
          dataKey="total"
          radius={[8, 8, 8, 8]}
          activeBar={<Rectangle fill={Colors.graphic.lineThird} stroke="purple" />}
          onClick={handleBarClick}
        >
          {normalizedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.total === maxValue
                  ? Colors.graphic.linePrimary
                  : Colors.graphic.lineSecondary
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
