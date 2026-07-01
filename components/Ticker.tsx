"use client";

import type { TickerEvent } from "@/lib/types";

interface TickerProps {
  events: TickerEvent[];
}

function messageFor(event: TickerEvent): string {
  return event.type === "undo"
    ? `↩️ ${event.name} took one back`
    : `🍺 ${event.name} just cracked one open`;
}

export default function Ticker({ events }: TickerProps) {
  if (events.length === 0) {
    return (
      <div className="bg-navy/80 border-t border-white/10 py-2.5 text-center text-white/40 text-sm">
        The ticker&apos;s quiet... for now.
      </div>
    );
  }

  const items = events.slice(0, 15);
  const strip = items.map(messageFor).join("   •   ");

  return (
    <div className="bg-navy/80 border-t border-white/10 py-2.5 overflow-hidden whitespace-nowrap">
      <div className="inline-flex animate-ticker">
        <span className="text-sm font-semibold text-white/80 pr-8">{strip}</span>
        <span className="text-sm font-semibold text-white/80 pr-8">{strip}</span>
      </div>
    </div>
  );
}
