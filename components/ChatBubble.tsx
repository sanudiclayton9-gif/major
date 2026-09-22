"use client";

import { useChat } from "ai/react";
import { useState } from "react";

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
  });

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[92vw] max-w-sm glass rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: 440 }}>
          <div className="bg-wine text-white px-4 py-3 flex items-center justify-between">
            <span className="font-display font-semibold">Ask us anything</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-3 text-sm">
            {messages.length === 0 && (
              <p className="text-ink-soft">
                Ask about our designs, prices, or stock — I'll answer from what
                we actually have in the shop.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] px-3 py-2 rounded-xl ${
                  m.role === "user"
                    ? "bg-wine text-white ml-auto"
                    : "bg-white/80 text-ink"
                }`}
              >
                {m.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white/80 text-ink-soft max-w-[85%] px-3 py-2 rounded-xl">
                Typing...
              </div>
            )}
            {error && !isLoading && (
              <div className="bg-red-50 text-red-700 max-w-[85%] px-3 py-2 rounded-xl">
                Sorry, the assistant is unavailable right now. Please message us
                on WhatsApp instead.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-white/30 flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about a design..."
              className="flex-1 rounded-full px-4 py-2 text-sm bg-white/80 border border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-wine text-white rounded-full px-4 py-2 text-sm font-semibold"
              disabled={isLoading}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-wine text-white shadow-xl flex items-center justify-center text-xl"
        aria-label="Open chat"
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
