import { useParams, useNavigate } from "react-router-dom";
import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { useEquipment, useEquipmentConnections } from "@/hooks/useEquipment";
import { DocumentRepository } from "@/components/equipment/DocumentRepository";
import { SensorHistoryChart } from "@/components/equipment/SensorHistoryChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Zap, CircleDot, ToggleRight, Cable, Cpu, Gauge, Activity, SunMedium, PanelTop, Ruler, Cog } from "lucide-react";

const typeIcon: Record<string, typeof Zap> = {
  generator: Zap,
  transformer: CircleDot,
  inverter: SunMedium,
  switchgear: Cpu,
  breaker: ToggleRight,
  bus: Cable,
  panel: PanelTop,
  meter: Gauge,
  vfd: Activity,
  motor: Cog,
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  online: "default",
  offline: "secondary",
  standby: "outline",
  warning: "outline",
  fault: "destructive",
  maintenance: "secondary",
};

const EquipmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: allEquipment = [], isLoading } = useEquipment();
  const { data: connections = [] } = useEquipmentConnections();

  const equipment = allEquipment.find((e) => e.id === id);

  const linkedConnections = connections.filter(
    (c) => c.from_equipment_id === id || c.to_equipment_id === id
  );
  const linkedEquipmentIds = linkedConnections.map((c) =>
    c.from_equipment_id === id ? c.to_equipment_id : c.from_equipment_id
  );
  const linkedEquipment = allEquipment.filter((e) => linkedEquipmentIds.includes(e.id));

  if (isLoading) {
    return (
      <ScadaLayout>
        <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
          <span className="text-sm font-mono text-muted-foreground animate-pulse">Loading...</span>
        </div>
      </ScadaLayout>
    );
  }

  if (!equipment) {
    return (
      <ScadaLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] gap-4">
          <span className="text-sm font-mono text-muted-foreground">Equipment not found</span>
          <Button variant="outline" size="sm" onClick={() => navigate("/equipment")}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />Back to Registry
          </Button>
        </div>
      </ScadaLayout>
    );
  }

  const Icon = typeIcon[equipment.type] || CircleDot;

  const infoFields = [
    { label: "Tag Number", value: equipment.tag_number },
    { label: "Type", value: equipment.type },
    { label: "Rating", value: equipment.rating ? `${equipment.rating} ${equipment.rating_unit ?? ""}` : null },
    { label: "Manufacturer", value: equipment.manufacturer },
    { label: "Model", value: equipment.model },
    { label: "Serial Number", value: equipment.serial_number },
    { label: "Installation Date", value: equipment.installation_date },
    { label: "Location", value: equipment.location },
  ].filter((f) => f.value);

  return (
    <ScadaLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/20">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider truncate">
                {equipment.name}
              </h2>
              <Badge variant={statusVariant[equipment.status]} className="font-mono text-[10px] uppercase">
                {equipment.status}
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">{equipment.tag_number} • {equipment.type}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Equipment Info */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider">Equipment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {infoFields.map((field) => (
                  <div key={field.label} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                    <span className="text-[11px] font-mono text-muted-foreground">{field.label}</span>
                    <span className="text-[11px] font-mono font-semibold text-foreground capitalize">{field.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Connected Equipment */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider">
                  Connections ({linkedEquipment.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {linkedEquipment.length === 0 ? (
                  <p className="text-xs font-mono text-muted-foreground py-4 text-center">No connections</p>
                ) : (
                  <div className="space-y-1.5">
                    {linkedEquipment.map((linked) => {
                      const conn = linkedConnections.find(
                        (c) => c.from_equipment_id === linked.id || c.to_equipment_id === linked.id
                      );
                      const LinkedIcon = typeIcon[linked.type] || CircleDot;
                      return (
                        <button
                          key={linked.id}
                          onClick={() => navigate(`/equipment/${linked.id}`)}
                          className="w-full flex items-center gap-2.5 p-2 rounded border border-border bg-muted/20 hover:bg-muted/50 transition-colors text-left"
                        >
                          <LinkedIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-mono font-bold text-foreground block truncate">{linked.tag_number}</span>
                            <span className="text-[10px] font-mono text-muted-foreground capitalize">{linked.type}</span>
                          </div>
                          {conn?.connection_type && (
                            <span className="text-[9px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted capitalize">
                              {conn.connection_type}
                            </span>
                          )}
                          <Badge variant={statusVariant[linked.status]} className="text-[9px] font-mono uppercase">
                            {linked.status}
                          </Badge>
                          <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Protection Settings */}
            {equipment.protection_settings && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider">Protection Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{equipment.protection_settings}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {equipment.notes && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{equipment.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Document Repository - Full Width */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase tracking-wider">Document Repository</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentRepository equipmentId={equipment.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ScadaLayout>
  );
};

export default EquipmentDetail;
