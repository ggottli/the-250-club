// Thin wrappers around localStorage. All calls are safe to make during SSR
// (they no-op) since these components render client-side.

const NAME_KEY = "250club:name";
const MEMBER_ID_KEY = "250club:memberId";
const MUTE_KEY = "250club:muted";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredName(): string {
  if (!isBrowser()) return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function setStoredName(name: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(NAME_KEY, name);
}

export function getMemberId(): string {
  if (!isBrowser()) return "";
  let id = window.localStorage.getItem(MEMBER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(MEMBER_ID_KEY, id);
  }
  return id;
}

export function getMuted(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  if (!isBrowser()) return;
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}
