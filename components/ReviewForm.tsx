"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReviewForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    await supabase.from("reviews").insert({ name: name.trim(), message: message.trim() });
    setName("");
    setMessage("");
    setSending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="glass rounded-2xl p-6 text-center max-w-md mx-auto">
        <p>Thank you — your feedback has been sent to us. 🙏</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 max-w-md mx-auto space-y-3">
      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg px-3 py-2 bg-white/70 border border-black/10"
        required
      />
      <textarea
        placeholder="What did you think of our service?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-lg px-3 py-2 bg-white/70 border border-black/10"
        required
      />
      <button
        disabled={sending}
        className="bg-wine text-white font-semibold px-5 py-2.5 rounded-full"
      >
        {sending ? "Sending..." : "Send feedback"}
      </button>
    </form>
  );
}
