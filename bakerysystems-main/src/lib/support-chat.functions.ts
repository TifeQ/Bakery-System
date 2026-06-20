import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  menu: z.string().optional().default(""),
});

const BASE_PROMPT =
  "You are a friendly customer support assistant for The Bakery, a Nigerian bakery that sells Bread, Pastries, and Custom Cakes. You help customers with questions about products, pricing, delivery, pickup times, and orders. The bakery is based in Lagos, Nigeria. Delivery and pickup times are between 8am and 6pm daily. Custom cakes require at least 48 hours notice. Keep responses short, friendly and helpful.\n\nWhen a customer asks about products or wants to browse, suggest they visit the Shop page. When they ask about an existing order, suggest they check with the kitchen. When they want to place an order, guide them to the Shop page to add items to cart. Include a clickable link in your response where relevant using this format: [Go to Shop](/products) or [View Menu](/products).";

export const groqChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.Groq_API1;
    if (!apiKey) throw new Error("Missing Groq_API1 secret");

    const systemContent = data.menu
      ? `${BASE_PROMPT}\n\nCurrent available menu:\n${data.menu}`
      : BASE_PROMPT;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemContent }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq request failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    const reply: string =
      json?.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't respond.";
    return { reply };
  });
