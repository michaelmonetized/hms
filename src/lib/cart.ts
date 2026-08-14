export type CartLine = {
  id: string;
  title: string;
  href: string;
  priceCents: number;
  qty: number;
};

export const CART_KEY = "hms.cart";

/**
 * Load cart
 */
export function loadCart(storage?: Pick<Storage, "getItem">): CartLine[] {
  const store = storage ?? (typeof localStorage === "undefined" ? undefined : localStorage);
  if (!store) return [];
  try {
    const raw = store.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed)
      ? parsed.filter((line) => line && typeof line.id === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Save cart
 */
export function saveCart(lines: CartLine[], storage?: Pick<Storage, "setItem">): void {
  const store = storage ?? (typeof localStorage === "undefined" ? undefined : localStorage);
  if (!store) return;
  store.setItem(CART_KEY, JSON.stringify(lines));
}

/**
 * Add line
 * Increments qty when the product is already in the cart.
 */
export function addLine(
  lines: CartLine[],
  incoming: Omit<CartLine, "qty"> & { qty?: number },
): CartLine[] {
  const qty = incoming.qty ?? 1;
  const existing = lines.find((line) => line.id === incoming.id);
  if (!existing) return [...lines, { ...incoming, qty }];
  return lines.map((line) => (line.id === incoming.id ? { ...line, qty: line.qty + qty } : line));
}

/**
 * Set qty
 * Drops the line when qty is 0.
 */
export function setLineQty(lines: CartLine[], id: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((line) => line.id !== id);
  return lines.map((line) => (line.id === id ? { ...line, qty } : line));
}

/**
 * Cart totals
 */
export function cartTotals(lines: CartLine[]): { count: number; totalCents: number } {
  return {
    count: lines.reduce((sum, line) => sum + line.qty, 0),
    totalCents: lines.reduce((sum, line) => sum + line.priceCents * line.qty, 0),
  };
}
