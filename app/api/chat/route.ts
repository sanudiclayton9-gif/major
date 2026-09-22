import { google } from "@ai-sdk/google";
import { streamText, type CoreMessage } from "ai";
import { getProducts } from "@/lib/products";
import { BUSINESS_NAME, WHATSAPP_NUMBER } from "@/lib/constants";

export const runtime = "edge";

export async function POST(req: Request) {
  let messages: unknown;
  try {
    ({ messages } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("[chat] GOOGLE_GENERATIVE_AI_API_KEY is not set");
    return Response.json(
      { error: "The assistant is not configured. Please message us on WhatsApp instead." },
      { status: 503 }
    );
  }

  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts();
  } catch (e) {
    console.error("[chat] could not load products", e);
  }

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

  try {
    // Model id is passed through a widening cast so this compiles even if the
    // installed @ai-sdk/google version's typed model union predates gemini-2.0-flash.
    const result = await streamText({
      model: google("gemini-2.0-flash" as never),
      system: systemPrompt,
      messages: messages as CoreMessage[],
    });

    return result.toDataStreamResponse();
  } catch (e: any) {
    console.error("[chat] streamText failed", e);
    return Response.json(
      { error: "The assistant is unavailable right now. Please message us on WhatsApp." },
      { status: 502 }
    );
  }
}
