"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Comment } from "@/lib/types";

export default function ProductComments({ productId }: { productId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("comments")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active && data) setComments(data as Comment[]);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setPosting(true);
    const { data } = await supabase
      .from("comments")
      .insert({ product_id: productId, name: name.trim(), text: text.trim() })
      .select()
      .single();
    if (data) setComments((prev) => [...prev, data as Comment]);
    setText("");
    setPosting(false);
  }

  return (
    <div className="mt-8">
      <h3 className="font-display font-semibold text-lg mb-3">Comments</h3>
      <div className="space-y-2 mb-4">
        {comments.length === 0 && (
          <p className="text-ink-soft text-sm">No comments yet — be the first.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="text-sm">
            <b>{c.name}</b> <span className="text-ink-soft">— {c.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm">
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm bg-white/70 border border-black/10"
          required
        />
        <textarea
          placeholder="Add a comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm bg-white/70 border border-black/10"
          required
        />
        <button
          type="submit"
          disabled={posting}
          className="self-start bg-ink text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          {posting ? "Posting..." : "Post comment"}
        </button>
      </form>
    </div>
  );
}
