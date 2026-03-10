import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { useConfigMode } from "@/hooks/useConfigMode";
import { useMarkerStore } from "@/hooks/useMarkerStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, ShieldAlert, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { configMode, setConfigMode } = useConfigMode();
  const { markers, updateMarkerPosition } = useMarkerStore();

  const handlePositionChange = (id: string, field: "left" | "top", value: string) => {
    if (!configMode) return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(100, num));
    const marker = markers.find((m) => m.id === id);
    if (!marker) return;
    updateMarkerPosition(id, field === "left" ? clamped : marker.left, field === "top" ? clamped : marker.top);
    toast.success("Position updated");
  };

  return (
    <ScadaLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Configuration Mode Master Toggle */}
        <Card className={`border-2 transition-colors ${configMode ? "border-scada-amber bg-scada-amber/5" : "border-border bg-card"}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {configMode ? (
                  <div className="w-10 h-10 rounded-lg bg-scada-amber/20 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-scada-amber" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-scada-green/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-scada-green" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-sm font-mono uppercase tracking-wider">
                    Configuration Mode
                  </CardTitle>
                  <CardDescription className="text-xs font-mono">
                    {configMode
                      ? "ACTIVE — Floor plan markers and SLD nodes can be repositioned. Connections can be drawn."
                      : "LOCKED — All views are in read-only display mode. Enable to configure layouts."}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold uppercase ${configMode ? "text-scada-amber" : "text-scada-green"}`}>
                  {configMode ? "Unlocked" : "Locked"}
                </span>
                <Switch
                  checked={configMode}
                  onCheckedChange={(checked) => {
                    setConfigMode(checked);
                    toast.success(checked ? "Configuration mode enabled" : "Configuration mode disabled — views locked");
                  }}
                />
              </div>
            </div>
          </CardHeader>
          {configMode && (
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-scada-amber/10 border border-scada-amber/30">
                <ShieldAlert className="w-4 h-4 text-scada-amber shrink-0" />
                <p className="text-[11px] font-mono text-scada-amber">
                  While configuration mode is active, you can drag markers on the Floor Plan, reposition and connect nodes on the Single Line Diagram. 
                  Disable when done to lock all views.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        <Tabs defaultValue="markers" className="w-full">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="markers" className="font-mono text-xs">Floor Plan Markers</TabsTrigger>
            <TabsTrigger value="general" className="font-mono text-xs">General</TabsTrigger>
          </TabsList>

          <TabsContent value="markers" className="space-y-4 mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono uppercase tracking-wider">Floor Plan Markers</CardTitle>
                <CardDescription className="text-xs font-mono">
                  Equipment with floor plan coordinates. {!configMode && "Enable Configuration Mode above to edit positions."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {markers.length === 0 && (
                    <p className="text-xs font-mono text-muted-foreground text-center py-4">
                      No equipment has floor plan positions set.
                    </p>
                  )}
                  {markers.map((marker) => (
                    <div
                      key={marker.id}
                      className="flex items-center gap-3 p-2 rounded border border-border bg-background"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-mono font-bold text-foreground truncate">{marker.label}</span>
                        <span className="text-[10px] font-mono text-muted-foreground capitalize">{marker.type}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] font-mono text-muted-foreground">X</Label>
                          <Input
                            type="number"
                            value={marker.left}
                            onChange={(e) => handlePositionChange(marker.id, "left", e.target.value)}
                            className="h-6 w-16 text-[10px] font-mono bg-card"
                            min={0} max={100} step={0.5}
                            disabled={!configMode}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] font-mono text-muted-foreground">Y</Label>
                          <Input
                            type="number"
                            value={marker.top}
                            onChange={(e) => handlePositionChange(marker.id, "top", e.target.value)}
                            className="h-6 w-16 text-[10px] font-mono bg-card"
                            min={0} max={100} step={0.5}
                            disabled={!configMode}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-mono uppercase tracking-wider">General Settings</CardTitle>
                <CardDescription className="text-xs font-mono">
                  System-wide configuration options.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-mono text-muted-foreground">No additional settings configured yet.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScadaLayout>
  );
};

export default Settings;
