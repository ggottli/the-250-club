import { DEFAULT_GOAL } from "./config";
import type { MilestoneHit } from "./types";

// Edit this file to add/adjust milestone copy and fun facts.

interface FixedMilestone {
  threshold: number;
  title: string;
  fact: string;
}

// Only used when a group's goal is exactly the default (250).
export const FIXED_MILESTONES: FixedMilestone[] = [
  { threshold: 25, title: "Case Cleared", fact: "A case down. The grill's just getting hot." },
  { threshold: 50, title: "Quarter Keg", fact: "Quarter of the way — that's a full cooler emptied." },
  { threshold: 76, title: "Spirit of '76", fact: "🎆 Seventeen-seventy-SIX. The spirit of independence flows." },
  { threshold: 100, title: "Triple Digits", fact: "Triple digits! Over 4 gallons of freedom consumed." },
  { threshold: 125, title: "Halfway to Glory", fact: "Halfway to glory. One keg drained." },
  { threshold: 176, title: "56 Signers", fact: "The Declaration had 56 signers — you've now toasted each of them ~3 times." },
  { threshold: 200, title: "Bring It Home", fact: "10.4 cases exist in this world. You're at 8. Bring it home." },
  { threshold: 250, title: "LIBERTY ACHIEVED", fact: "🦅🎆 LIBERTY ACHIEVED. Fireworks. Anthem. Glory." },
];

interface PercentMilestone {
  pct: number;
  title: string;
  fact: string;
}

// Fallback for custom goals, since the 1776-themed facts only line up at 250.
export const PERCENT_MILESTONES: PercentMilestone[] = [
  { pct: 10, title: "Warming Up", fact: "10% down — the party's just getting started." },
  { pct: 25, title: "Quarter Way", fact: "A quarter of the way to the goal!" },
  { pct: 50, title: "Halfway There", fact: "Halfway to the goal — keep it going!" },
  { pct: 75, title: "Three Quarters", fact: "75% there. The finish line is in sight." },
  { pct: 90, title: "Almost There", fact: "90%! Just a little more to go." },
  { pct: 100, title: "GOAL SMASHED", fact: "🎉 Goal achieved! Incredible work, team." },
];

export const FUN_FACTS: string[] = [
  "250 beers ≈ 37,500 calories ≈ roughly 107 hot dogs of energy. Pace yourselves.",
  "That's about 23 gallons — enough to fill a small aquarium you should absolutely not fill with beer.",
  "A keg pours ~165. Past 165, someone go get the second keg.",
  "Stacked end to end, 250 cans is taller than a 3-story building.",
  "The British surrendered at Yorktown in 1781. You'll surrender to a hangover around beer #180.",
];

// Given the total before and after a tap, return the highest milestone crossed, if any.
export function getCrossedMilestone(
  prevTotal: number,
  newTotal: number,
  goal: number
): MilestoneHit | null {
  if (goal === DEFAULT_GOAL) {
    let crossed: FixedMilestone | null = null;
    for (const m of FIXED_MILESTONES) {
      if (prevTotal < m.threshold && newTotal >= m.threshold) crossed = m;
    }
    if (!crossed) return null;
    return { title: crossed.title, fact: crossed.fact, isFinale: crossed.threshold >= goal };
  }

  let crossed: PercentMilestone | null = null;
  for (const m of PERCENT_MILESTONES) {
    const thresholdVal = (m.pct / 100) * goal;
    if (prevTotal < thresholdVal && newTotal >= thresholdVal) crossed = m;
  }
  if (!crossed) return null;
  return { title: crossed.title, fact: crossed.fact, isFinale: crossed.pct >= 100 };
}
