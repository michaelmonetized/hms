import type { CSSProperties } from "react";
import type { BlockStyle, Breakpoint } from "./content";

/**
 * Style to CSS
 * Maps inspector spacing and color onto inline styles.
 */
export function styleToCss(style?: BlockStyle): CSSProperties {
  if (!style) return {};
  const css: CSSProperties = {};
  if (style.paddingTop !== undefined) css.paddingTop = style.paddingTop;
  if (style.paddingRight !== undefined) css.paddingRight = style.paddingRight;
  if (style.paddingBottom !== undefined) css.paddingBottom = style.paddingBottom;
  if (style.paddingLeft !== undefined) css.paddingLeft = style.paddingLeft;
  if (style.marginTop !== undefined) css.marginTop = style.marginTop;
  if (style.marginBottom !== undefined) css.marginBottom = style.marginBottom;
  if (style.background) css.background = style.background;
  if (style.color) css.color = style.color;
  if (style.maxWidth) {
    css.maxWidth = style.maxWidth;
    if (style.align === "center") {
      css.marginLeft = "auto";
      css.marginRight = "auto";
    }
  }
  if (style.fontSize) css.fontSize = style.fontSize;
  if (style.align === "center") css.textAlign = "center";
  if (style.align === "right") css.textAlign = "right";
  if (style.align === "left") css.textAlign = "left";
  return css;
}

/**
 * Hide on class
 * Tailwind classes that hide a block at a published breakpoint.
 */
export function hideOnClass(hideOn?: Breakpoint[]): string {
  if (!hideOn || hideOn.length === 0) return "";
  const classes: string[] = [];
  if (hideOn.includes("mobile")) classes.push("max-md:hidden");
  if (hideOn.includes("tablet")) classes.push("md:max-lg:hidden");
  if (hideOn.includes("desktop")) classes.push("lg:hidden");
  return classes.join(" ");
}

/**
 * Align class
 */
export function alignClass(align?: "left" | "center" | "right"): string {
  if (align === "center") return "items-center text-center";
  if (align === "right") return "items-end text-right";
  if (align === "left") return "items-start text-left";
  return "";
}
