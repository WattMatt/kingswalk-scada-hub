/**
 * Auto-layout algorithm for Single Line Diagram.
 * Creates a hierarchical layout based on connection topology.
 */

import type { Equipment, EquipmentConnection } from "@/hooks/useEquipment";

interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

const TYPE_PRIORITY: Record<string, number> = {
  bus: 0,
  switchgear: 1,
  breaker: 2,
  transformer: 3,
  panel: 3,
  meter: 3,
  vfd: 4,
  inverter: 4,
  generator: 5,
  motor: 5,
};

/**
 * Arrange equipment in a hierarchical layout.
 * Buses at top, generators/motors at bottom, everything else in between.
 */
export function autoLayout(
  equipment: Equipment[],
  connections: EquipmentConnection[],
  canvasWidth: number = 1200,
  canvasHeight: number = 800
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (equipment.length === 0) return positions;

  // Group by priority tier
  const tiers = new Map<number, Equipment[]>();
  equipment.forEach((e) => {
    const priority = TYPE_PRIORITY[e.type] ?? 3;
    if (!tiers.has(priority)) tiers.set(priority, []);
    tiers.get(priority)!.push(e);
  });

  const sortedTierKeys = [...tiers.keys()].sort((a, b) => a - b);
  const tierCount = sortedTierKeys.length;
  const verticalPadding = 80;
  const horizontalPadding = 100;
  const availableHeight = canvasHeight - verticalPadding * 2;
  const availableWidth = canvasWidth - horizontalPadding * 2;
  const tierSpacing = tierCount > 1 ? availableHeight / (tierCount - 1) : 0;

  sortedTierKeys.forEach((tierKey, tierIdx) => {
    const items = tiers.get(tierKey)!;
    const y = verticalPadding + tierIdx * tierSpacing;
    const itemSpacing = items.length > 1 ? availableWidth / (items.length - 1) : 0;

    items.forEach((item, itemIdx) => {
      const x = items.length === 1
        ? canvasWidth / 2
        : horizontalPadding + itemIdx * itemSpacing;
      positions.set(item.id, { x, y });
    });
  });

  // Refine: try to align connected nodes horizontally
  for (let pass = 0; pass < 3; pass++) {
    connections.forEach((conn) => {
      const fromPos = positions.get(conn.from_equipment_id);
      const toPos = positions.get(conn.to_equipment_id);
      if (!fromPos || !toPos) return;

      // Nudge child toward parent's x, gently
      const fromEquip = equipment.find((e) => e.id === conn.from_equipment_id);
      const toEquip = equipment.find((e) => e.id === conn.to_equipment_id);
      if (!fromEquip || !toEquip) return;

      const fromPriority = TYPE_PRIORITY[fromEquip.type] ?? 3;
      const toPriority = TYPE_PRIORITY[toEquip.type] ?? 3;

      if (fromPriority < toPriority) {
        // to is child — nudge toward from's x
        toPos.x = toPos.x * 0.6 + fromPos.x * 0.4;
      } else if (toPriority < fromPriority) {
        fromPos.x = fromPos.x * 0.6 + toPos.x * 0.4;
      }
    });
  }

  return positions;
}
