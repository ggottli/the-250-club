"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { MilestoneHit } from "@/lib/types";

interface MilestoneModalProps {
  milestone: MilestoneHit;
  onDismiss: () => void;
}

export default function MilestoneModal({ milestone, onDismiss }: MilestoneModalProps) {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ["#f4b942", "#b31942", "#ffffff", "#0a1a3c"],
    });
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6"
      onClick={onDismiss}
    >
      <div className="animate-pop-in max-w-sm w-full bg-gradient-to-b from-navy to-navy-deep border-2 border-gold rounded-3xl px-6 py-8 text-center shadow-2xl">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-black text-gold mb-2">{milestone.title}</h2>
        <p className="text-white/80">{milestone.fact}</p>
        <p className="text-white/40 text-xs mt-6">tap to dismiss</p>
      </div>
    </div>
  );
}
