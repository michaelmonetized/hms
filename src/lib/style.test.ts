import { describe, expect, test } from "vite-plus/test";
import { alignClass, hideOnClass, styleToCss } from "./style";

describe("styleToCss", () => {
  test("maps spacing and color", () => {
    const css = styleToCss({
      paddingTop: 16,
      marginBottom: 8,
      background: "#111",
      color: "#fff",
      fontSize: 20,
    });
    expect(css.paddingTop).toBe(16);
    expect(css.marginBottom).toBe(8);
    expect(css.background).toBe("#111");
    expect(css.color).toBe("#fff");
    expect(css.fontSize).toBe(20);
  });

  test("centers a max-width block", () => {
    const css = styleToCss({ maxWidth: 720, align: "center" });
    expect(css.maxWidth).toBe(720);
    expect(css.marginLeft).toBe("auto");
    expect(css.marginRight).toBe("auto");
    expect(css.textAlign).toBe("center");
  });
});

describe("hideOnClass", () => {
  test("emits breakpoint classes", () => {
    expect(hideOnClass(["mobile"])).toContain("max-md:hidden");
    expect(hideOnClass(["desktop"])).toContain("lg:hidden");
    expect(hideOnClass()).toBe("");
  });
});

describe("alignClass", () => {
  test("returns flex alignment", () => {
    expect(alignClass("center")).toContain("text-center");
    expect(alignClass()).toBe("");
  });
});
