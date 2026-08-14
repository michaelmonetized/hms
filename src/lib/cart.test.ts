import { describe, expect, test } from "vite-plus/test";
import { addLine, cartTotals, loadCart, saveCart, setLineQty } from "./cart";

describe("cart", () => {
  test("adds a new line and increments qty", () => {
    const first = addLine([], { id: "p1", title: "Pro", href: "/shop/pro", priceCents: 4900 });
    const second = addLine(first, { id: "p1", title: "Pro", href: "/shop/pro", priceCents: 4900 });
    expect(second).toHaveLength(1);
    expect(second[0].qty).toBe(2);
    expect(cartTotals(second)).toEqual({ count: 2, totalCents: 9800 });
  });

  test("drops a line at qty 0", () => {
    const lines = addLine([], { id: "p1", title: "Pro", href: "/s", priceCents: 100 });
    expect(setLineQty(lines, "p1", 0)).toEqual([]);
  });

  test("round-trips through storage", () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
    };
    const lines = addLine([], { id: "p1", title: "Pro", href: "/s", priceCents: 100, qty: 3 });
    saveCart(lines, storage);
    expect(loadCart(storage)[0].qty).toBe(3);
  });
});
