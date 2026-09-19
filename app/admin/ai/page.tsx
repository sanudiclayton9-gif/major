"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AdminAIPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Shalom, your Wear Chimsol AI assistant. Ask me about your products, prices, sizes, or stock.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const message = input.trim();

    if (!message || loading) {
      return;
    }

    setInput("");

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText || "AI request failed."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            responseText || "I didn't receive a response.",
        },
      ]);
    } catch (error) {
      console.error("AI error:", error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `AI error: ${error.message}`
              : "Sorry, something went wrong while connecting to the AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="mb-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold"
        >
          ← Back to Dashboard
        </button>

        <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
          Artificial Intelligence
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Wear Chimsol AI
        </h1>

        <p className="mt-2 text-slate-600">
          Your AI-powered store assistant.
        </p>
      </div>

      <section className="mt-10 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b bg-slate-950 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
              🤖
            </div>

            <div>
              <h2 className="font-black">
                Wear Chimsol Assistant
              </h2>

              <p className="text-sm text-slate-300">
                Powered by Gemini
              </p>
            </div>
          </div>
        </div>

        <div className="h-[500px] space-y-5 overflow-y-auto p-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                  message.role === "user"
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                <p className="whitespace-pre-wrap leading-7">
                  {message.content}
                </p>

                {message.role === "assistant" &&
                  loading &&
                  index === messages.length - 1 && (
                    <div className="mt-2 flex gap-1 text-slate-500">
                      <span className="animate-bounce">•</span>
                      <span className="animate-bounce [animation-delay:150ms]">
                        •
                      </span>
                      <span className="animate-bounce [animation-delay:300ms]">
                        •
                      </span>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-5">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask the AI about your products..."
              className="flex-1 rounded-full border bg-white px-5 py-3 outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100"
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-full bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-40"
            >
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            AI responses are based on your current store
            product data.
          </p>
        </div>
      </section>
    </main>
  );
}