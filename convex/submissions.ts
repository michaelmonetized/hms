import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

export const list = query({
  args: { formId: v.string() },
  handler: async (ctx, { formId }) => {
    await requireIdentity(ctx);
    return ctx.db
      .query("submissions")
      .withIndex("by_form", (q) => q.eq("formId", formId))
      .collect();
  },
});

export const create = mutation({
  args: {
    formId: v.string(),
    values: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("submissions", {
      formId: args.formId,
      values: args.values,
      createdAt: Date.now(),
    });
  },
});
