"use client";

import { avatarFor } from "@/lib/avatar";
import type { LeaderboardEntry } from "@/lib/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  myMemberId: string;
}

export default function Leaderboard({ entries, myMemberId }: LeaderboardProps) {
  const topScore = entries[0]?.count ?? 0;

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => {
        const { emoji, color } = avatarFor(entry.memberId);
        const isLeader = entry.count > 0 && entry.count === topScore;
        const isMe = entry.memberId === myMemberId;
        return (
          <div
            key={entry.memberId}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
              isMe ? "bg-gold/15 border border-gold/40" : "bg-white/5 border border-white/10"
            }`}
          >
            <span className="text-white/40 font-bold w-5 text-sm">{i + 1}</span>
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: color + "33" }}
            >
              {emoji}
            </span>
            <span className="flex-1 font-semibold text-white truncate">
              {entry.name}
              {isMe && <span className="text-gold text-xs ml-1">(you)</span>}
            </span>
            {isLeader && <span className="text-lg">👑</span>}
            <span className="font-black text-white tabular-nums">{entry.count}</span>
          </div>
        );
      })}
      {entries.length === 0 && (
        <p className="text-white/40 text-sm text-center py-4">
          No one&apos;s cracked one open yet. Be the first!
        </p>
      )}
    </div>
  );
}
