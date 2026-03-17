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
  Cell,
} from "recharts";
import Colors from "@/shared/theme/colors";
import { getMonthLabelFromNumber, getMonthNumberFromLabel, MonthSelection, MONTH_LABELS_ES } from "./monthUtils";
import { formatCOP } from "../../indexDashboard"

interface YearlyGraphProps {
  title?: string;
  data: { month: string; total: number }[];
  onMonthClick: (month: MonthSelection) => void;
  isCurrency?: boolean;
}

type TooltipPayloadItem = {
  value?: number | string;
  payload?: {
    month?: string;
  };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  isCurrency: boolean;
};

type ChartBarClickPayload = {
  payload?: {
    month?: string;
    total?: number;
  };
};

const CustomTooltip = ({ active, payload, isCurrency }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const firstItem = payload[0];
    const value = Number(firstItem?.value ?? 0);
    const displayValue = isCurrency ? formatCOP(value) : value;
    const monthLabel = firstItem?.payload?.month ?? "";

    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800">{`Mes: ${monthLabel}`}</p>
        <p className="text-gray-600">{`Total: ${displayValue}`}</p>
      </div>
    );
  }
  return null;
};

export const YearlyGraph = ({ data, onMonthClick, isCurrency = true }: YearlyGraphProps) => {
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

  const handleBarClick = (entry: ChartBarClickPayload) => {
    const monthLabel = entry?.payload?.month;
    if (!monthLabel) return;
    const monthValue = getMonthNumberFromLabel(monthLabel);
    onMonthClick({
      label: monthLabel,
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
