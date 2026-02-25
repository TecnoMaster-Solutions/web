import Colors from "@/shared/theme/colors";
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface CategoryData {
  category: string;
  value: number;
}

export const PieChartCategoryAndProducts = ({ data }: { data: CategoryData[] }) => {
  const RADIAN = Math.PI / 180;

  const COLORS = [
    Colors.graphic.circle.primary,
    Colors.graphic.circle.secondary,
    Colors.graphic.circle.tertiary,
    Colors.graphic.circle.quaternary,
    Colors.graphic.circle.quinary,
    Colors.graphic.circle.scenery,
  ];

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const total = data.reduce((sum, d) => sum + d.value, 0);

      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-bold">{`Categoría: ${item.category}`}</p>
          <p>{`Cantidad: ${item.value}`}</p>
          <p>{`Porcentaje: ${((item.value / total) * 100).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center w-full h-full overflow-hidden">
      <div className="w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={{ strokeWidth: 3 }}
              label={renderCustomizedLabel}
              outerRadius={70}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.category}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full mt-3 space-y-2 overflow-y-auto max-h-[110px] px-2">
        {data.map((entry, index) => (
          <div key={entry.category} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-gray-700 truncate">{entry.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
