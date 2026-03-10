import type { Equipment } from "@/hooks/useEquipment";

export interface SLDGroup {
  id: string;
  label: string;
  /** Tag pattern — equipment whose tag_number matches is a member */
  pattern: RegExp;
  /** The tag_number of the anchor node that stays visible when collapsed */
  anchorTag: string;
  /** Colour accent for the collapse badge */
  color: string;
}

/**
 * Predefined collapsible groups for the SLD.
 * Order matters — first match wins if patterns ever overlap.
 */
export const SLD_GROUPS: SLDGroup[] = [
  {
    id: "pv-section-1",
    label: "PV Section 1",
    pattern: /^INV-1[A-I]$/,
    anchorTag: "PV-BUS-1",
    color: "#22c55e",
  },
  {
    id: "pv-section-2",
    label: "PV Section 2",
    pattern: /^INV-2[A-I]$/,
    anchorTag: "PV-BUS-2",
    color: "#22c55e",
  },
  {
    id: "gen-bank-1",
    label: "Gen Bank 1",
    pattern: /^(GEN-1[A-C]|CB-G1[A-C])$/,
    anchorTag: "CB-GB1",
    color: "#f59e0b",
  },
  {
    id: "gen-bank-2",
    label: "Gen Bank 2",
    pattern: /^(GEN-2[A-C]|CB-G2[A-C])$/,
    anchorTag: "CB-GB2",
    color: "#f59e0b",
  },
];

/** Map each equipment item to its group (if any). Returns group id or null. */
export function getEquipmentGroup(
  item: Equipment,
  groups: SLDGroup[]
): string | null {
  for (const g of groups) {
    if (g.pattern.test(item.tag_number)) return g.id;
  }
  return null;
}

/** Build a set of hidden equipment IDs based on collapsed groups */
export function getHiddenIds(
  equipment: Equipment[],
  collapsedGroups: Set<string>,
  groups: SLDGroup[] = SLD_GROUPS
): Set<string> {
  const hidden = new Set<string>();
  if (collapsedGroups.size === 0) return hidden;

  for (const item of equipment) {
    const groupId = getEquipmentGroup(item, groups);
    if (groupId && collapsedGroups.has(groupId)) {
      hidden.add(item.id);
    }
  }
  return hidden;
}

/** For a collapsed group, find the anchor equipment ID */
export function getAnchorId(
  equipment: Equipment[],
  group: SLDGroup
): string | undefined {
  return equipment.find((e) => e.tag_number === group.anchorTag)?.id;
}

/** Count members in each group */
export function getGroupCounts(
  equipment: Equipment[],
  groups: SLDGroup[] = SLD_GROUPS
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const g of groups) {
    counts.set(g.id, 0);
  }
  for (const item of equipment) {
    const gId = getEquipmentGroup(item, groups);
    if (gId) counts.set(gId, (counts.get(gId) || 0) + 1);
  }
  return counts;
}
