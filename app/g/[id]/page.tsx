"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import PintGlass from "@/components/PintGlass";
import BeerButton from "@/components/BeerButton";
import Leaderboard from "@/components/Leaderboard";
import Ticker from "@/components/Ticker";
import ShareButton from "@/components/ShareButton";
import FunFactBanner from "@/components/FunFactBanner";
import MilestoneModal from "@/components/MilestoneModal";
import FinaleOverlay from "@/components/FinaleOverlay";
import {
  getMemberId,
  getStoredName,
  setMemberId as persistMemberId,
  setStoredName,
} from "@/lib/storage";
import { playCrackAndPour, vibrate } from "@/lib/sound";
import { getCrossedMilestone } from "@/lib/content";
import { POLL_INTERVAL_MS } from "@/lib/config";
import type { GroupState, MilestoneHit } from "@/lib/types";

interface NameConflict {
  message: string;
  existingMemberId: string;
  choosingNewName: boolean;
}

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const groupId = params.id;

  const [name, setName] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [groupState, setGroupState] = useState<GroupState | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [nameConflict, setNameConflict] = useState<NameConflict | null>(null);
  const [replacementName, setReplacementName] = useState("");
  const [milestoneHit, setMilestoneHit] = useState<MilestoneHit | null>(null);
  const [showFinale, setShowFinale] = useState(false);

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
    } catch {
      // transient network error, next poll retries
    }
  }, [groupId, applyTotal]);

  const joinGroup = useCallback(
    async (candidateName: string, candidateMemberId: string) => {
      setJoinBusy(true);
      setJoinError("");
      try {
        const res = await fetch(`/api/groups/${groupId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: candidateMemberId, name: candidateName }),
        });
        const data = await res.json();
        if (res.status === 404) {
          setNotFound(true);
          return false;
        }
        if (res.status === 409 && data.code === "NAME_TAKEN") {
          setJoined(false);
          setNameConflict({
            message: data.error,
            existingMemberId: data.existingMemberId,
            choosingNewName: false,
          });
          return false;
        }
        if (!res.ok) {
          setJoinError(data.error ?? "Couldn't join this group.");
          return false;
        }

        setName(data.name);
        setStoredName(data.name);
        setNameConflict(null);
        setJoined(true);
        return true;
      } catch {
        setJoinError("Something went wrong. Try again.");
        return false;
      } finally {
        setJoinBusy(false);
      }
    },
    [groupId]
  );

  // Join the group, then start polling.
  useEffect(() => {
    if (!name || !memberId || !groupId) return;
    let cancelled = false;

    (async () => {
      await joinGroup(name, memberId);
      if (!cancelled) fetchState();
    })();

    const interval = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [name, memberId, groupId, fetchState, joinGroup]);

  const fireLocalCelebration = useCallback(() => {
    playCrackAndPour();
    vibrate(40);
    confetti({
      particleCount: 30,
      spread: 55,
      startVelocity: 30,
      origin: { y: 0.75 },
      colors: ["#f4b942", "#b31942", "#ffffff"],
    });
  }, []);

  const handleAdd = useCallback(async () => {
    if (!memberId) return;
    fireLocalCelebration();
    try {
      const res = await fetch(`/api/groups/${groupId}/beer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
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

  async function confirmExistingAccount() {
    if (!nameConflict || !name) return;
    persistMemberId(nameConflict.existingMemberId);
    setMemberId(nameConflict.existingMemberId);
    await joinGroup(name, nameConflict.existingMemberId);
    fetchState();
  }

  async function submitReplacementName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = replacementName.trim();
    if (!trimmed || !memberId) return;
    const didJoin = await joinGroup(trimmed, memberId);
    if (didJoin) {
      setReplacementName("");
      fetchState();
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

  return (
    <main className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <header className="px-4 pt-5 pb-2 text-center">
        <h1 className="font-black text-white text-xl truncate">{meta.name}</h1>
      </header>

      <section className="flex flex-col items-center py-4">
        <PintGlass total={total} goal={meta.goal} size="lg" />
      </section>

      <section className="flex flex-col items-center gap-3 px-4">
        <BeerButton onAdd={handleAdd} disabled={!memberId || !joined} />
        <div className="text-center">
          <p className="text-white/70 text-sm">
            Your count: <span className="font-bold text-white">{myCount}</span>
          </p>
          <button onClick={handleUndo} className="text-xs text-white/40 underline mt-0.5">
            Undo last beer
          </button>
          {joinError && !nameConflict && (
            <p className="mt-2 text-sm text-firecracker-bright">{joinError}</p>
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
      {nameConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/90 p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="name-conflict-title"
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-navy p-5 shadow-2xl"
          >
            <h2 id="name-conflict-title" className="text-xl font-black text-white">
              Name already in use
            </h2>
            {!nameConflict.choosingNewName ? (
              <>
                <p className="mt-3 text-white/75">{nameConflict.message}</p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setNameConflict((current) =>
                        current ? { ...current, choosingNewName: true } : current
                      )
                    }
                    className="flex-1 rounded-xl bg-white/10 py-3 font-bold text-white"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={confirmExistingAccount}
                    disabled={joinBusy}
                    className="flex-1 rounded-xl bg-firecracker py-3 font-bold text-white disabled:opacity-40"
                  >
                    Yes, that&apos;s me
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={submitReplacementName} className="mt-4 flex flex-col gap-3">
                <label htmlFor="replacement-name" className="text-sm font-bold text-white/75">
                  Choose a different name
                </label>
                <input
                  id="replacement-name"
                  autoFocus
                  value={replacementName}
                  onChange={(e) => setReplacementName(e.target.value)}
                  maxLength={24}
                  className="rounded-xl bg-white px-4 py-3 font-bold text-navy-deep outline-none focus:ring-4 focus:ring-gold"
                />
                {joinError && <p className="text-sm text-firecracker-bright">{joinError}</p>}
                <button
                  type="submit"
                  disabled={joinBusy || !replacementName.trim()}
                  className="rounded-xl bg-firecracker py-3 font-bold text-white disabled:opacity-40"
                >
                  Use this name
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
