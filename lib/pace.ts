import type { TickerEvent } from "./types";

export interface PaceInfo {
  perHour: number;
  etaLabel: string | null; // e.g. "9:40 PM", or null if goal already hit / no signal yet
}

const WINDOW_MS = 60 * 60 * 1000; // look at the trailing hour of activity

// Cold-start friendly: needs at least a couple of "beer" events within the
// trailing window before it will estimate a pace.
export function computePace(events: TickerEvent[], total: number, goal: number, now: number): PaceInfo {
  const beerEvents = events.filter((e) => e.type === "beer" && now - e.ts <= WINDOW_MS);

  if (beerEvents.length < 2) {
    return { perHour: 0, etaLabel: null };
  }

  const oldestTs = Math.min(...beerEvents.map((e) => e.ts));
  const spanMs = Math.max(now - oldestTs, 60_000); // avoid divide-by-near-zero
  const perHour = (beerEvents.length / spanMs) * 60 * 60 * 1000;

  if (perHour <= 0 || total >= goal) {
    return { perHour: Math.round(perHour), etaLabel: null };
  }

  const remaining = goal - total;
  const hoursLeft = remaining / perHour;
  const etaMs = now + hoursLeft * 60 * 60 * 1000;
  const eta = new Date(etaMs);
  const etaLabel = eta.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return { perHour: Math.round(perHour), etaLabel };
}
