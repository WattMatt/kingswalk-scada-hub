import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useSensorHistory } from "@/hooks/useSensorHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";

interface Props {
  equipmentId: string;
}

export function SensorHistoryChart({ equipmentId }: Props) {
  const { data: rows = [], isLoading } = useSensorHistory(equipmentId, 30);

  const chartData = useMemo(() => {
    return rows.map((r) => ({
      time: new Date(r.recorded_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      kW: r.kw,
      V: r.voltage,
      A: r.current,
      PF: r.power_factor,
      Hz: r.frequency,
    }));
  }, [rows]);

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-12">
          <span className="text-xs font-mono text-muted-foreground animate-pulse">Loading sensor history...</span>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            Sensor History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs font-mono text-muted-foreground text-center py-8">
            No sensor data recorded yet. Data will appear as the system collects readings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    grid: { stroke: "hsl(215, 15%, 20%)", strokeDasharray: "3 3" },
    axis: { fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(215, 15%, 50%)" },
    tooltip: {
      contentStyle: {
        backgroundColor: "hsl(220, 18%, 12%)",
        border: "1px solid hsl(215, 15%, 25%)",
        borderRadius: 6,
        fontSize: 11,
        fontFamily: "IBM Plex Mono",
      },
    },
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          Sensor History — Last 30 min
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="power" className="w-full">
          <TabsList className="bg-muted/30 border border-border h-7">
            <TabsTrigger value="power" className="text-[10px] font-mono h-5 px-2">Power (kW)</TabsTrigger>
            <TabsTrigger value="electrical" className="text-[10px] font-mono h-5 px-2">V / A</TabsTrigger>
            <TabsTrigger value="quality" className="text-[10px] font-mono h-5 px-2">PF / Hz</TabsTrigger>
          </TabsList>

          <TabsContent value="power" className="mt-3">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid {...chartConfig.grid} />
                  <XAxis dataKey="time" tick={chartConfig.axis} interval="preserveStartEnd" />
                  <YAxis tick={chartConfig.axis} width={45} />
                  <Tooltip {...chartConfig.tooltip} />
                  <Line type="monotone" dataKey="kW" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="electrical" className="mt-3">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid {...chartConfig.grid} />
                  <XAxis dataKey="time" tick={chartConfig.axis} interval="preserveStartEnd" />
                  <YAxis yAxisId="v" tick={chartConfig.axis} width={45} />
                  <YAxis yAxisId="a" orientation="right" tick={chartConfig.axis} width={45} />
                  <Tooltip {...chartConfig.tooltip} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                  <Line yAxisId="v" type="monotone" dataKey="V" stroke="hsl(43, 96%, 56%)" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="a" type="monotone" dataKey="A" stroke="hsl(199, 89%, 48%)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="mt-3">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid {...chartConfig.grid} />
                  <XAxis dataKey="time" tick={chartConfig.axis} interval="preserveStartEnd" />
                  <YAxis yAxisId="pf" tick={chartConfig.axis} width={45} domain={[0.7, 1.05]} />
                  <YAxis yAxisId="hz" orientation="right" tick={chartConfig.axis} width={45} domain={[49.5, 50.5]} />
                  <Tooltip {...chartConfig.tooltip} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                  <Line yAxisId="pf" type="monotone" dataKey="PF" stroke="hsl(280, 60%, 60%)" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="hz" type="monotone" dataKey="Hz" stroke="hsl(160, 60%, 50%)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
