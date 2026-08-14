import { action } from "./_generated/server";
import { v } from "convex/values";

declare const process: { env: Record<string, string | undefined> };

/**
 * Send email
 * Sends through Resend using the deployment's RESEND_API_KEY.
 * @param to - Recipient email
 * @param subject - Subject line
 * @param html - HTML body
 * @returns Resend message id
 */
export const send = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set on the Convex deployment");

    const from = process.env.RESEND_FROM ?? "HMS <notify@uncap.us>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
      }),
    });
    const payload = (await response.json()) as { id?: string; message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? `Resend error ${response.status}`);
    }
    return { id: payload.id };
  },
});

/**
 * Send test email
 * Mails the signed-in user so we can confirm deliverability.
 */
export const sendTest = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const to = identity.email;
    if (!to) throw new Error("Signed-in user has no email");

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set on the Convex deployment");

    const from = process.env.RESEND_FROM ?? "HMS <notify@uncap.us>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "HMS is live",
        html: "<p>This is a test from HMS. Mail is working.</p>",
      }),
    });
    const payload = (await response.json()) as { id?: string; message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? `Resend error ${response.status}`);
    }
    return { id: payload.id, to };
  },
});
