// Thin wrappers around localStorage. All calls are safe to make during SSR
// (they no-op) since these components render client-side.

const NAME_KEY = "250club:name";
const MEMBER_ID_KEY = "250club:memberId";

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

export function setMemberId(memberId: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(MEMBER_ID_KEY, memberId);
}
