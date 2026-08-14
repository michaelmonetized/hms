import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { addLine, cartTotals, loadCart, saveCart, setLineQty, type CartLine } from "@/lib/cart";

type CartBag = {
  lines: CartLine[];
  count: number;
  totalCents: number;
  add: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  setQty: (id: string, qty: number) => void;
};

const CartContext = createContext<CartBag>({
  lines: [],
  count: 0,
  totalCents: 0,
  add: () => undefined,
  setQty: () => undefined,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadCart());

  const commit = useCallback((next: CartLine[]) => {
    setLines(next);
    saveCart(next);
  }, []);

  const value = useMemo<CartBag>(() => {
    const totals = cartTotals(lines);
    return {
      lines,
      count: totals.count,
      totalCents: totals.totalCents,
      add: (line) => commit(addLine(lines, line)),
      setQty: (id, qty) => commit(setLineQty(lines, id, qty)),
    };
  }, [commit, lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
