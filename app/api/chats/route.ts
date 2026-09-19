import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getProducts } from "@/lib/products";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response("Message is required.", {
        status: 400,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        "GEMINI_API_KEY is missing from the server environment.",
        { status: 500 }
      );
    }

    const products = await getProducts();

    const { text } = await generateText({
      model: google("gemini-3.6-flash"),

      system: `
You are Shalom, the Wear Chimsol AI store assistant.

Current product data:

${JSON.stringify(products)}

Be friendly and concise.

Only use the product data provided.
Do not invent products, prices, sizes, or stock.
If information is unavailable, say so.
`,

      prompt: message,
    });

    console.log("========== AI RESPONSE ==========");
    console.log(text);
    console.log("=================================");

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("========== AI ERROR ==========");
    console.error(error);
    console.error("==============================");

    return new Response(
      error instanceof Error
        ? `AI ERROR: ${error.message}`
        : "AI ERROR: Unknown error",
      { status: 500 }
    );
  }
}