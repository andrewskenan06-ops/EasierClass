"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, icalUrl }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col gap-8 px-6 py-24">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            EasierClass
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            One place for your Blackboard due dates. Paste your feed link below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              School email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@fordham.edu"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="icalUrl" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Blackboard calendar feed URL
            </label>
            <input
              id="icalUrl"
              type="url"
              required
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              placeholder="https://blackboard.fordham.edu/webapps/calendar/calendarFeed/..."
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              In Blackboard: Calendar → the settings/gear icon → "Share Calendar." Copy that link.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-black px-5 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Connecting…" : "Connect Blackboard"}
          </button>
        </form>
      </main>
    </div>
  );
}
