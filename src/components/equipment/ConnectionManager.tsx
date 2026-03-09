import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, ArrowRight } from "lucide-react";
import { useCreateConnection, useDeleteConnection, type Equipment, type EquipmentConnection } from "@/hooks/useEquipment";
import { toast } from "sonner";

interface ConnectionManagerProps {
  equipment: Equipment[];
  connections: EquipmentConnection[];
}

export function ConnectionManager({ equipment, connections }: ConnectionManagerProps) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [connType, setConnType] = useState("electrical");
  const [label, setLabel] = useState("");
  const createConnection = useCreateConnection();
  const deleteConnection = useDeleteConnection();

  const getName = (id: string) => equipment.find((e) => e.id === id)?.tag_number ?? id;

  const handleAdd = () => {
    if (!fromId || !toId) return toast.error("Select both equipment items");
    if (fromId === toId) return toast.error("Cannot connect to self");

    createConnection.mutate(
      { from_equipment_id: fromId, to_equipment_id: toId, connection_type: connType || null, label: label || null },
      {
        onSuccess: () => { toast.success("Connection created"); setFromId(""); setToId(""); setLabel(""); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteConnection.mutate(id, {
      onSuccess: () => toast.success("Connection removed"),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="space-y-4">
      {/* Add connection */}
      <div className="space-y-3 p-3 rounded border border-border bg-muted/30">
        <p className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">New Connection</p>
        <div className="grid grid-cols-2 gap-2">
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger className="font-mono text-xs"><SelectValue placeholder="From..." /></SelectTrigger>
            <SelectContent>
              {equipment.map((e) => (
                <SelectItem key={e.id} value={e.id} className="font-mono text-xs">
                  {e.tag_number} — {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger className="font-mono text-xs"><SelectValue placeholder="To..." /></SelectTrigger>
            <SelectContent>
              {equipment.filter((e) => e.id !== fromId).map((e) => (
                <SelectItem key={e.id} value={e.id} className="font-mono text-xs">
                  {e.tag_number} — {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={connType} onValueChange={setConnType}>
            <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["electrical", "mechanical", "data", "control"].map((t) => (
                <SelectItem key={t} value={t} className="font-mono text-xs capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="font-mono text-xs"
            maxLength={100}
          />
        </div>
        <Button size="sm" className="w-full gap-1.5 text-xs font-mono" onClick={handleAdd} disabled={createConnection.isPending}>
          <Plus className="w-3 h-3" />
          Add Connection
        </Button>
      </div>

      {/* Existing connections */}
      <div className="space-y-1.5">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          {connections.length} Connection{connections.length !== 1 ? "s" : ""}
        </p>
        {connections.length === 0 && (
          <p className="text-xs font-mono text-muted-foreground py-4 text-center">No connections yet</p>
        )}
        {connections.map((conn) => (
          <div key={conn.id} className="flex items-center gap-2 p-2 rounded border border-border bg-card group">
            <span className="text-xs font-mono font-bold text-foreground">{getName(conn.from_equipment_id)}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-mono font-bold text-foreground">{getName(conn.to_equipment_id)}</span>
            {conn.connection_type && (
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted capitalize">
                {conn.connection_type}
              </span>
            )}
            {conn.label && (
              <span className="text-[10px] font-mono text-muted-foreground">{conn.label}</span>
            )}
            <div className="ml-auto">
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(conn.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
