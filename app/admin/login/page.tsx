"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
          Admin
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Welcome back
        </h1>

        <p className="mt-3 text-slate-600">
          Sign in to manage Wear Chimsol.
        </p>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >
          <div>
            <label className="text-sm font-bold">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}