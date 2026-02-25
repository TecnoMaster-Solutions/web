import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface BarConfig {
  dataKey: string;
  color: string;
  radius?: [number, number, number, number];
}

interface CustomBarChartProps {
  data: any[];
  xKey: string;
  bars: BarConfig[];
  width?: number;
  height?: number;
}

// Componente personalizado para el Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800 mb-2">{`Estado: ${label}`}</p>
        <p className="text-sm" style={{ color: payload[0].color }}>
          {`Total: ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

export const CustomBarChart: React.FC<CustomBarChartProps> = ({
  data,
  xKey,
  bars,
  height = 300,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 1,
          left: 1,
          bottom: 5,
        }}
        barGap={0}
        barCategoryGap={8}
      >
        <CartesianGrid stroke="transparent" strokeDasharray="9 9" />
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fontWeight: "bold" }}
        />
        <YAxis hide={true} />
        
        <Tooltip content={<CustomTooltip />} />

        {bars.map((bar, index) => (
          <Bar
            key={index}
            dataKey={bar.dataKey}
            name="Total"
            radius={bar.radius || [0, 0, 0, 0]}
            stackId="a"
            fill={bar.color}
            barSize={25}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};
