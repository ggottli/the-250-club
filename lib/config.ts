// Central place for tweakable app-wide constants.

export const APP_TITLE = "The 250 Club";
export const APP_TAGLINE = "Fourth of July Beer Tracker";

export const DEFAULT_GOAL = 250;
export const MIN_BEER_DELTA = 1;
export const MAX_BEER_DELTA = 5;

export const POLL_INTERVAL_MS = 3000;
export const FUN_FACT_ROTATE_MS = 30000;
export const HOLD_TO_ADD_TICK_MS = 400;
export const HOLD_TO_ADD_START_DELAY_MS = 450;

export const TICKER_MAX_EVENTS = 50;

export const PALETTE = {
  navy: "#0a1a3c",
  red: "#b31942",
  white: "#ffffff",
  gold: "#f4b942",
  goldDark: "#c98a1b",
} as const;
