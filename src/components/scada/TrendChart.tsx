import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TrendPoint } from "@/hooks/useScadaData";

interface TrendChartProps {
  data: TrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="scada-panel p-4 h-full">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Power Trend — Last 30 Min</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "hsl(215 15% 55%)", fontFamily: "IBM Plex Mono" }}
            stroke="hsl(220 14% 20%)"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(215 15% 55%)", fontFamily: "IBM Plex Mono" }}
            stroke="hsl(220 14% 20%)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220 18% 13%)",
              border: "1px solid hsl(220 14% 20%)",
              borderRadius: "6px",
              fontFamily: "IBM Plex Mono",
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(210 20% 90%)" }}
          />
          <Legend
            wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="generation"
            name="Generation (MW)"
            stroke="hsl(142 71% 45%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="load"
            name="Load (MW)"
            stroke="hsl(43 96% 56%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
