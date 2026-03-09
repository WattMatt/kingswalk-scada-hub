import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Link2 } from "lucide-react";
import type { Equipment, EquipmentConnection } from "@/hooks/useEquipment";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  online: "default",
  offline: "secondary",
  standby: "outline",
  warning: "outline",
  fault: "destructive",
  maintenance: "secondary",
};

interface EquipmentTableProps {
  equipment: Equipment[];
  connections: EquipmentConnection[];
  isLoading: boolean;
  onEdit: (item: Equipment) => void;
  onDelete: (id: string) => void;
}

export function EquipmentTable({ equipment, connections, isLoading, onEdit, onDelete }: EquipmentTableProps) {
  const navigate = useNavigate();
  const getConnectionCount = (id: string) =>
    connections.filter((c) => c.from_equipment_id === id || c.to_equipment_id === id).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm font-mono text-muted-foreground animate-pulse">Loading equipment...</span>
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-sm font-mono text-muted-foreground">No equipment registered yet</p>
          <p className="text-xs font-mono text-muted-foreground/70">Click "Add Equipment" to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono text-xs">Tag</TableHead>
            <TableHead className="font-mono text-xs">Name</TableHead>
            <TableHead className="font-mono text-xs">Type</TableHead>
            <TableHead className="font-mono text-xs">Status</TableHead>
            <TableHead className="font-mono text-xs">Rating</TableHead>
            <TableHead className="font-mono text-xs">Location</TableHead>
            <TableHead className="font-mono text-xs text-center">Links</TableHead>
            <TableHead className="font-mono text-xs w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => {
            const linkCount = getConnectionCount(item.id);
            return (
              <TableRow key={item.id} className="group cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/equipment/${item.id}`)}>
                <TableCell className="font-mono text-xs font-bold text-primary">{item.tag_number}</TableCell>
                <TableCell className="font-mono text-xs">{item.name}</TableCell>
                <TableCell className="font-mono text-xs capitalize">{item.type}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[item.status] ?? "secondary"} className="font-mono text-[10px] uppercase">
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {item.rating ? `${item.rating} ${item.rating_unit ?? ""}` : "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.location || "—"}</TableCell>
                <TableCell className="text-center">
                  {linkCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
                      <Link2 className="w-3 h-3" />{linkCount}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
