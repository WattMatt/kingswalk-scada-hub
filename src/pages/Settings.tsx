import { useState } from "react";
import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { useMarkerStore, type MarkerConfig } from "@/hooks/useMarkerStore";
import { useEquipment } from "@/hooks/useEquipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { markers, updateMarkerPosition } = useMarkerStore();
  const { data: equipment = [] } = useEquipment();

  const handlePositionChange = (id: string, field: "left" | "top", value: string) => {
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
                  Markers are sourced from the Equipment Registry. Set marker_left and marker_top on any equipment to place it on the floor plan. 
                  Edit positions here or drag on the Process floor plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {markers.length === 0 && (
                    <p className="text-xs font-mono text-muted-foreground text-center py-4">
                      No equipment has floor plan positions set. Go to the Equipment Registry to add equipment, then set their marker coordinates.
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
                            min={0}
                            max={100}
                            step={0.5}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] font-mono text-muted-foreground">Y</Label>
                          <Input
                            type="number"
                            value={marker.top}
                            onChange={(e) => handlePositionChange(marker.id, "top", e.target.value)}
                            className="h-6 w-16 text-[10px] font-mono bg-card"
                            min={0}
                            max={100}
                            step={0.5}
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
