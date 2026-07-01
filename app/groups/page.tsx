"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PintGlass from "@/components/PintGlass";
import { APP_TITLE, DEFAULT_GOAL, POLL_INTERVAL_MS } from "@/lib/config";
import { getStoredName } from "@/lib/storage";
import type { PublicGroupSummary } from "@/lib/types";

export default function GroupsPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [publicGroups, setPublicGroups] = useState<PublicGroupSummary[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupSearch, setGroupSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createGoal, setCreateGoal] = useState(String(DEFAULT_GOAL));
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const storedName = getStoredName();
    if (!storedName) {
      router.replace("/");
      return;
    }
    // Reads from localStorage, an external system unavailable during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(storedName);
  }, [router]);

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setPublicGroups(data.groups ?? []);
    } catch {
      // Ignore transient fetch errors; next poll will retry.
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    if (!name) return;
    // Kicks off polling of an external system (the API); not a pure render computation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGroups();
    const interval = setInterval(loadGroups, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [name, loadGroups]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = createName.trim();
    if (!trimmed) return;
    setCreateBusy(true);
    setCreateError("");
    try {
      const goalNum = Number(createGoal) || DEFAULT_GOAL;
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, goal: goalNum }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Couldn't create the group.");
        return;
      }
      router.push(`/g/${data.groupId}`);
    } catch {
      setCreateError("Something went wrong. Try again.");
    } finally {
      setCreateBusy(false);
    }
  }

  if (!name) return null;

  const normalizedSearch = groupSearch.trim().toLocaleLowerCase();
  const visibleGroups = normalizedSearch
    ? publicGroups.filter((group) => group.name.toLocaleLowerCase().includes(normalizedSearch))
    : publicGroups;

  return (
    <main className="flex-1 flex flex-col px-4 py-8 max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-white">{APP_TITLE}</h1>
        <p className="text-white/60 text-sm mt-1">
          Hey <span className="text-gold font-bold">{name}</span> — join a group or start your own.
        </p>
      </div>

      <section className="mb-6">
        <h2 className="text-white/80 font-bold text-sm uppercase tracking-wide mb-3">
          Find a group by name
        </h2>
        <input
          type="search"
          value={groupSearch}
          onChange={(e) => setGroupSearch(e.target.value)}
          placeholder="Search group names"
          className="mb-3 w-full rounded-xl bg-white/95 px-4 py-3 font-semibold text-navy-deep outline-none placeholder:text-navy-deep/40 focus:ring-4 focus:ring-gold"
        />
        {loadingGroups && publicGroups.length === 0 && (
          <p className="text-white/40 text-sm">Loading...</p>
        )}
        {!loadingGroups && publicGroups.length === 0 && (
          <p className="text-white/40 text-sm">No groups yet — be the first!</p>
        )}
        {!loadingGroups && publicGroups.length > 0 && visibleGroups.length === 0 && (
          <p className="text-white/40 text-sm">No group names match that search.</p>
        )}
        <div className="flex flex-col gap-2">
          {visibleGroups.map((g) => (
            <Link
              key={g.id}
              href={`/g/${g.id}`}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition"
            >
              <PintGlass total={g.total} goal={g.goal} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{g.name}</div>
                <div className="text-xs text-white/50">
                  {g.memberCount} {g.memberCount === 1 ? "person" : "people"} · {g.total}/{g.goal}
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${Math.min(100, (g.total / g.goal) * 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full rounded-2xl bg-firecracker hover:bg-firecracker-bright active:scale-[0.98] transition text-white font-black text-lg py-4 shadow-lg shadow-firecracker/30"
          >
            + Create new group
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <h3 className="font-bold text-white">Create a group</h3>
            <input
              autoFocus
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Group name (e.g. Backyard Crew)"
              maxLength={40}
              className="rounded-xl bg-white/95 text-navy-deep font-semibold px-4 py-3 outline-none focus:ring-4 focus:ring-gold"
            />
            <div className="flex items-center gap-3">
              <label className="text-white/70 text-sm font-semibold">Goal</label>
              <input
                type="number"
                min={1}
                value={createGoal}
                onChange={(e) => setCreateGoal(e.target.value)}
                className="w-24 rounded-xl bg-white/95 text-navy-deep font-semibold px-3 py-2 outline-none focus:ring-4 focus:ring-gold"
              />
              <span className="text-white/50 text-sm">beers</span>
            </div>
            {createError && <p className="text-firecracker-bright text-sm">{createError}</p>}
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-xl bg-white/10 text-white font-bold py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createBusy || !createName.trim()}
                className="flex-1 rounded-xl bg-firecracker hover:bg-firecracker-bright text-white font-bold py-3 disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="flex-1" />
    </main>
  );
}
