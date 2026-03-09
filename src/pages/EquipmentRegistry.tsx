import { useState } from "react";
import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { ConnectionManager } from "@/components/equipment/ConnectionManager";
import { useEquipment, useEquipmentConnections, useDeleteEquipment, type Equipment } from "@/hooks/useEquipment";
import { Button } from "@/components/ui/button";
import { Plus, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const EquipmentRegistry = () => {
  const { data: equipment = [], isLoading } = useEquipment();
  const { data: connections = [] } = useEquipmentConnections();
  const deleteEquipment = useDeleteEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  const handleEdit = (item: Equipment) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEquipment.mutate(id, {
      onSuccess: () => toast.success("Equipment deleted"),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  return (
    <ScadaLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col p-4 gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-mono font-bold text-foreground uppercase tracking-wider">Equipment Registry</h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {equipment.length} items registered • {connections.length} connections
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setConnectionsOpen(true)}>
              <Link2 className="w-3.5 h-3.5" />
              Connections
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setFormOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              Add Equipment
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 scada-panel">
          <EquipmentTable
            equipment={equipment}
            connections={connections}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={formOpen} onOpenChange={(open) => { if (!open) handleFormClose(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-wider">
                {editingItem ? "Edit Equipment" : "Add Equipment"}
              </DialogTitle>
            </DialogHeader>
            <EquipmentForm
              equipment={editingItem}
              onSuccess={handleFormClose}
            />
          </DialogContent>
        </Dialog>

        {/* Connections Dialog */}
        <Dialog open={connectionsOpen} onOpenChange={setConnectionsOpen}>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm uppercase tracking-wider">
                Equipment Connections
              </DialogTitle>
            </DialogHeader>
            <ConnectionManager equipment={equipment} connections={connections} />
          </DialogContent>
        </Dialog>
      </div>
    </ScadaLayout>
  );
};

export default EquipmentRegistry;
