import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { getProducts } from "@/lib/products";
import { BUSINESS_NAME, WHATSAPP_NUMBER } from "@/lib/constants";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const products = await getProducts();
  const catalog = products
    .map(
      (p) =>
        `- ${p.name} — $${p.price} — stock: ${p.stock} — sizes: ${
          p.sizes.join(", ") || "one size"
        } — ${p.description}`
    )
    .join("\n");

  const systemPrompt = `You are the shop assistant for ${BUSINESS_NAME}, a tailor in Harare, Zimbabwe.

Answer customer questions ONLY using the product catalog below. Never invent
products, prices, or stock levels that aren't listed.

If an item is out of stock, say so honestly and suggest a similar in-stock
item if one exists.

If you don't know the answer, or the question is about something other than
these products (e.g. custom orders, delivery, general questions), tell the
customer to message us directly on WhatsApp: +${WHATSAPP_NUMBER}.

Keep answers short and friendly — this is a chat bubble on a small business
website, not a long essay.

CURRENT CATALOG:
${catalog || "(no products listed yet)"}`;

  const result = await streamText({
    model: google("gemini-1.5-flash"),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
