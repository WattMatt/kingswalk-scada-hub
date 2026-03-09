import { useState } from "react";
import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { useMarkerStore, type MarkerConfig } from "@/hooks/useMarkerStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, RotateCcw, GripVertical } from "lucide-react";
import { useScadaData } from "@/hooks/useScadaData";
import { toast } from "sonner";

const GENERATOR_IDS = ["GEN-01", "GEN-02", "GEN-03", "GEN-04"];
const MARKER_TYPES = [
  { value: "generator", label: "Generator" },
  { value: "transformer", label: "Transformer" },
  { value: "switchgear", label: "Switchgear" },
  { value: "breaker", label: "Breaker" },
  { value: "bus", label: "Bus" },
  { value: "custom", label: "Custom" },
] as const;

const EQUIPMENT_IDS = ["XFMR-1", "XFMR-2", "SWG-1", "CB-01", "CB-02", "BUS-1"];

const Settings = () => {
  const { markers, addMarker, removeMarker, updateMarkerPosition, resetMarkers } = useMarkerStore();
  const { generators } = useScadaData();

  // New marker form state
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<MarkerConfig["type"]>("generator");
  const [newLinkedGen, setNewLinkedGen] = useState<string>("");
  const [newLinkedEquip, setNewLinkedEquip] = useState<string>("");

  const handleAdd = () => {
    if (!newLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    const isGen = newType === "generator";
    const marker: MarkerConfig = {
      id: `marker-${Date.now()}`,
      label: newLabel.trim(),
      type: newType,
      left: 50,
      top: 50,
      linkedGenerator: isGen && newLinkedGen && newLinkedGen !== "none" ? newLinkedGen : undefined,
      linkedEquipment: !isGen && newLinkedEquip && newLinkedEquip !== "none" ? newLinkedEquip : undefined,
    };
    addMarker(marker);
    setNewLabel("");
    setNewLinkedGen("");
    setNewLinkedEquip("");
    toast.success(`Marker "${marker.label}" added — go to Process tab to drag it into position`);
  };

  const handleReset = () => {
    resetMarkers();
    toast.success("Markers reset to defaults");
  };

  const handlePositionChange = (id: string, field: "left" | "top", value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(100, num));
    const marker = markers.find((m) => m.id === id);
    if (!marker) return;
    updateMarkerPosition(id, field === "left" ? clamped : marker.left, field === "top" ? clamped : marker.top);
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
            {/* Add new marker */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono uppercase tracking-wider">Add New Marker</CardTitle>
                <CardDescription className="text-xs font-mono">
                  Create a marker, then drag it on the Process floor plan to position it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono">Label</Label>
                    <Input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. T1"
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono">Type</Label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as MarkerConfig["type"])}>
                      <SelectTrigger className="h-8 text-xs font-mono bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MARKER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="text-xs font-mono">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono">Link Generator</Label>
                    <Select value={newLinkedGen} onValueChange={setNewLinkedGen}>
                      <SelectTrigger className="h-8 text-xs font-mono bg-background">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs font-mono">None</SelectItem>
                        {GENERATOR_IDS.map((id) => (
                          <SelectItem key={id} value={id} className="text-xs font-mono">
                            {id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAdd} size="sm" className="h-8 gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing markers */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-mono uppercase tracking-wider">Current Markers</CardTitle>
                  <CardDescription className="text-xs font-mono">
                    {markers.length} marker{markers.length !== 1 ? "s" : ""} configured. Edit positions here or drag on the floor plan.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs font-mono" onClick={handleReset}>
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {markers.length === 0 && (
                    <p className="text-xs font-mono text-muted-foreground text-center py-4">No markers configured</p>
                  )}
                  {markers.map((marker) => {
                    const gen = marker.linkedGenerator
                      ? generators.find((g) => g.id === marker.linkedGenerator)
                      : undefined;
                    return (
                      <div
                        key={marker.id}
                        className="flex items-center gap-3 p-2 rounded border border-border bg-background"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-background shrink-0 ${
                            gen ? (gen.status === "running" ? "bg-scada-green" : gen.status === "fault" ? "bg-destructive" : "bg-scada-amber") : "bg-blue-500"
                          }`}>
                            {marker.label}
                          </div>
                          <span className="text-xs font-mono text-foreground truncate">{marker.label}</span>
                          <span className="text-[10px] font-mono text-muted-foreground capitalize">{marker.type}</span>
                          {marker.linkedGenerator && (
                            <span className="text-[10px] font-mono text-primary">→ {marker.linkedGenerator}</span>
                          )}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => {
                              removeMarker(marker.id);
                              toast.success(`Marker "${marker.label}" removed`);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
