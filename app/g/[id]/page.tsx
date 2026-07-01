"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import PintGlass from "@/components/PintGlass";
import BeerButton from "@/components/BeerButton";
import Leaderboard from "@/components/Leaderboard";
import Ticker from "@/components/Ticker";
import MuteToggle from "@/components/MuteToggle";
import ShareButton from "@/components/ShareButton";
import FunFactBanner from "@/components/FunFactBanner";
import MilestoneModal from "@/components/MilestoneModal";
import FinaleOverlay from "@/components/FinaleOverlay";
import Footer from "@/components/Footer";
import { getMemberId, getStoredName, getMuted, setMuted as persistMuted } from "@/lib/storage";
import { playCrackAndPour, vibrate } from "@/lib/sound";
import { getCrossedMilestone } from "@/lib/content";
import { computePace } from "@/lib/pace";
import { POLL_INTERVAL_MS } from "@/lib/config";
import type { GroupState, MilestoneHit } from "@/lib/types";

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const groupId = params.id;

  const [name, setName] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [groupState, setGroupState] = useState<GroupState | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [milestoneHit, setMilestoneHit] = useState<MilestoneHit | null>(null);
  const [showFinale, setShowFinale] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy invite");
  const [now, setNow] = useState<number | null>(null);

  const prevTotalRef = useRef<number | null>(null);
  const finaleShownRef = useRef(false);

  useEffect(() => {
    const storedName = getStoredName();
    if (!storedName) {
      router.replace("/");
      return;
    }
    // Reads from localStorage, an external system unavailable during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(storedName);
    setMemberId(getMemberId());
    setMutedState(getMuted());
  }, [router]);

  const applyTotal = useCallback((newTotal: number, goal: number) => {
    if (prevTotalRef.current === null) {
      prevTotalRef.current = newTotal;
      if (newTotal >= goal) finaleShownRef.current = true;
      return;
    }
    const prev = prevTotalRef.current;
    prevTotalRef.current = newTotal;
    if (newTotal === prev) return;
    const hit = getCrossedMilestone(prev, newTotal, goal);
    if (!hit) return;
    if (hit.isFinale) {
      if (!finaleShownRef.current) {
        finaleShownRef.current = true;
        setShowFinale(true);
      }
    } else {
      setMilestoneHit(hit);
    }
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data: GroupState = await res.json();
      applyTotal(data.total, data.meta.goal);
      setGroupState(data);
      setNow(Date.now());
    } catch {
      // transient network error, next poll retries
    }
  }, [groupId, applyTotal]);

  // Join the group, then start polling.
  useEffect(() => {
    if (!name || !memberId || !groupId) return;
    let cancelled = false;

    (async () => {
      try {
        await fetch(`/api/groups/${groupId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId, name }),
        });
      } catch {
        // ignore; polling will still show group state
      }
      if (!cancelled) fetchState();
    })();

    const interval = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [name, memberId, groupId, fetchState]);

  const fireLocalCelebration = useCallback(() => {
    if (!muted) {
      playCrackAndPour();
      vibrate(40);
    }
    confetti({
      particleCount: 30,
      spread: 55,
      startVelocity: 30,
      origin: { y: 0.75 },
      colors: ["#f4b942", "#b31942", "#ffffff"],
    });
  }, [muted]);

  const handleAdd = useCallback(async () => {
    if (!memberId) return;
    fireLocalCelebration();
    try {
      const res = await fetch(`/api/groups/${groupId}/beer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, delta: 1 }),
      });
      const data = await res.json();
      if (res.ok && groupState) {
        applyTotal(data.total, groupState.meta.goal);
      }
      fetchState();
    } catch {
      // ignore; UI will reconcile on next poll
    }
  }, [memberId, groupId, groupState, applyTotal, fetchState, fireLocalCelebration]);

  const handleUndo = useCallback(async () => {
    if (!memberId) return;
    try {
      await fetch(`/api/groups/${groupId}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      fetchState();
    } catch {
      // ignore
    }
  }, [memberId, groupId, fetchState]);

  function toggleMute() {
    const next = !muted;
    setMutedState(next);
    persistMuted(next);
  }

  async function handleCopyInvite() {
    if (!groupState) return;
    const url = `${window.location.origin}/g/${groupId}`;
    const text = `Join "${groupState.meta.name}" on The 250 Club! Code: ${groupState.meta.joinCode} — ${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy invite"), 2000);
    } catch {
      // clipboard unsupported; ignore
    }
  }

  if (notFound) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-white text-lg font-bold">Group not found.</p>
        <button
          onClick={() => router.push("/groups")}
          className="rounded-xl bg-firecracker px-5 py-3 font-bold text-white"
        >
          Back to groups
        </button>
      </main>
    );
  }

  if (!name || !groupState) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-white/50">Loading...</p>
      </main>
    );
  }

  const { meta, total, leaderboard, events } = groupState;
  const myEntry = leaderboard.find((e) => e.memberId === memberId);
  const myCount = myEntry?.count ?? 0;
  const pace = computePace(events, total, meta.goal, now ?? meta.createdAt);

  return (
    <main className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="min-w-0">
          <h1 className="font-black text-white text-lg truncate">{meta.name}</h1>
          <button
            onClick={handleCopyInvite}
            className="text-xs text-gold font-bold tracking-wide"
          >
            Code: {meta.joinCode} · {copyLabel}
          </button>
        </div>
        <MuteToggle muted={muted} onToggle={toggleMute} />
      </header>

      <section className="flex flex-col items-center py-4">
        <PintGlass total={total} goal={meta.goal} size="lg" />
      </section>

      <section className="flex flex-col items-center gap-3 px-4">
        <BeerButton onAdd={handleAdd} disabled={!memberId} />
        <div className="text-center">
          <p className="text-white/70 text-sm">
            Your count: <span className="font-bold text-white">{myCount}</span>
          </p>
          <button onClick={handleUndo} className="text-xs text-white/40 underline mt-0.5">
            Undo last beer
          </button>
        </div>
      </section>

      <section className="px-4 mt-4">
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-sm text-white/70">
          {pace.etaLabel ? (
            <>
              Group pace: <span className="font-bold text-gold">{pace.perHour}/hr</span> — on
              track to hit {meta.goal} by{" "}
              <span className="font-bold text-white">{pace.etaLabel}</span>.
            </>
          ) : total >= meta.goal ? (
            <span className="font-bold text-gold">Goal reached. Legends.</span>
          ) : (
            "Keep tapping — pace will show once a few beers are logged."
          )}
        </div>
      </section>

      <section className="px-4 mt-4">
        <FunFactBanner />
      </section>

      <section className="px-4 mt-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white/80 font-bold text-sm uppercase tracking-wide">
            Leaderboard
          </h2>
          <ShareButton groupName={meta.name} total={total} goal={meta.goal} />
        </div>
        <Leaderboard entries={leaderboard} myMemberId={memberId ?? ""} />
      </section>

      <div className="flex-1" />
      <Ticker events={events} />
      <Footer />

      {milestoneHit && (
        <MilestoneModal milestone={milestoneHit} onDismiss={() => setMilestoneHit(null)} />
      )}
      {showFinale && (
        <FinaleOverlay
          groupName={meta.name}
          total={total}
          goal={meta.goal}
          onDismiss={() => setShowFinale(false)}
        />
      )}
    </main>
  );
}
