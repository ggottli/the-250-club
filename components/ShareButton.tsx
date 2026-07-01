"use client";

import { useState } from "react";
import { generateShareCardDataUrl } from "@/lib/shareCard";

interface ShareButtonProps {
  groupName: string;
  total: number;
  goal: number;
  label?: string;
}

export default function ShareButton({ groupName, total, goal, label = "Share progress" }: ShareButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    setBusy(true);
    try {
      const dataUrl = generateShareCardDataUrl(groupName, total, goal);
      if (!dataUrl) return;

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "250club.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: groupName,
          text: `${groupName} — ${total}/${goal} beers on The 250 Club 🍺🎆`,
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "250club.png";
        link.click();
      }
    } catch {
      // user cancelled share sheet, or an unsupported browser — no-op
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={busy}
      className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 text-sm disabled:opacity-40"
    >
      📤 {label}
    </button>
  );
}
