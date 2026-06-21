export interface Segment {
  key: "new" | "repeat" | "vip" | "inactive";
  label: string;
  variant: "default" | "secondary" | "success" | "warning";
}

export interface SegmentInput {
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | Date | null;
}

/** Derive a CRM segment from customer rollups. */
export function segmentOf(c: SegmentInput): Segment {
  const last = c.lastOrderAt ? new Date(c.lastOrderAt) : null;
  const daysSince = last ? (Date.now() - last.getTime()) / 86400000 : Infinity;

  if (c.ordersCount >= 5 || c.totalSpent >= 1000) {
    return { key: "vip", label: "VIP", variant: "success" };
  }
  if (last && daysSince > 90) {
    return { key: "inactive", label: "Inactivo", variant: "warning" };
  }
  if (c.ordersCount >= 2) {
    return { key: "repeat", label: "Recurrente", variant: "default" };
  }
  return { key: "new", label: "Nuevo", variant: "secondary" };
}

/** Average days between orders (purchase frequency); null if not enough data. */
export function purchaseFrequencyDays(
  ordersCount: number,
  firstOrderAt: string | Date | null,
  lastOrderAt: string | Date | null
): number | null {
  if (ordersCount < 2 || !firstOrderAt || !lastOrderAt) return null;
  const span = new Date(lastOrderAt).getTime() - new Date(firstOrderAt).getTime();
  if (span <= 0) return null;
  return Math.round(span / 86400000 / (ordersCount - 1));
}
