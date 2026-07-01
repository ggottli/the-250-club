"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import ShareButton from "./ShareButton";

interface FinaleOverlayProps {
  groupName: string;
  total: number;
  goal: number;
  onDismiss: () => void;
}

export default function FinaleOverlay({ groupName, total, goal, onDismiss }: FinaleOverlayProps) {
  useEffect(() => {
    const colors = ["#f4b942", "#b31942", "#ffffff", "#3ea6ff"];
    let cancelled = false;

    function burst() {
      if (cancelled) return;
      confetti({
        particleCount: 60,
        startVelocity: 45,
        spread: 360,
        ticks: 80,
        origin: { x: Math.random(), y: Math.random() * 0.4 },
        colors,
        scalar: 1.1,
      });
    }

    burst();
    const interval = setInterval(burst, 600);
    const grandFinale = setTimeout(() => {
      confetti({ particleCount: 220, spread: 130, origin: { y: 0.5 }, colors });
    }, 300);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(grandFinale);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-deep/95 px-6 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="animate-firework absolute text-6xl"
            style={{
              left: `${15 + i * 14}%`,
              top: `${10 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            🎆
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 animate-pop-in">
        <div className="text-6xl">🦅🎆</div>
        <h1 className="text-4xl font-black text-gold leading-tight">LIBERTY ACHIEVED</h1>
        <p className="text-white/80 font-semibold">
          {groupName} hit {total}/{goal} beers. Fireworks. Anthem. Glory.
        </p>

        <div className="flex gap-3 mt-4">
          <ShareButton groupName={groupName} total={total} goal={goal} label="Share the win" />
          <button
            onClick={onDismiss}
            className="rounded-xl bg-firecracker hover:bg-firecracker-bright text-white font-bold px-4 py-2.5 text-sm"
          >
            Keep partying →
          </button>
        </div>
      </div>
    </div>
  );
}
