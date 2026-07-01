"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TITLE } from "@/lib/config";
import { getMemberId, getStoredName, setStoredName } from "@/lib/storage";

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Reads from localStorage, an external system unavailable during SSR —
    // must run in an effect rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(getStoredName());
    getMemberId(); // ensures a memberId is generated up front
    setReady(true);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setStoredName(trimmed);
    router.push("/groups");
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-20 text-8xl select-none flex flex-wrap gap-8 justify-center items-center">
        <span>🎆</span>
        <span>🍺</span>
        <span>🦅</span>
        <span>🎆</span>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-5xl mb-3">🍺🎆</div>
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">
          {APP_TITLE}
        </h1>
        <p className="text-gold font-semibold mb-8">
          Fourth of July Beer Tracker
        </p>

        {ready && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={24}
              className="w-full rounded-2xl bg-white/95 text-navy-deep text-xl font-bold px-5 py-4 text-center outline-none ring-4 ring-transparent focus:ring-gold placeholder:text-navy-deep/40"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full rounded-2xl bg-firecracker hover:bg-firecracker-bright active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100 text-white text-xl font-black py-4 shadow-lg shadow-firecracker/30"
            >
              Let&apos;s go 🎇
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
