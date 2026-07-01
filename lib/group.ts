import { redis, keys } from "./redis";
import { TICKER_MAX_EVENTS } from "./config";
import type { GroupMeta, GroupState, LeaderboardEntry, TickerEvent } from "./types";

interface RawGroupMeta {
  [key: string]: string | number | boolean | undefined;
  name?: string;
  goal?: string | number;
  createdAt?: string | number;
}

export async function getGroupMeta(id: string): Promise<GroupMeta | null> {
  const raw = await redis.hgetall<RawGroupMeta>(keys.groupMeta(id));
  if (!raw || !raw.name) return null;
  return {
    id,
    name: String(raw.name),
    goal: Number(raw.goal) || 250,
    createdAt: Number(raw.createdAt) || 0,
  };
}

export async function getLeaderboard(id: string): Promise<LeaderboardEntry[]> {
  const [members, rawScored] = await Promise.all([
    redis.hgetall<Record<string, string>>(keys.groupMembers(id)),
    redis.zrange<(string | number)[]>(keys.groupCounts(id), 0, -1, {
      withScores: true,
      rev: true,
    }),
  ]);

  const scores = new Map<string, number>();
  for (let i = 0; i < rawScored.length; i += 2) {
    scores.set(String(rawScored[i]), Number(rawScored[i + 1]));
  }

  const memberEntries = Object.entries(members ?? {});
  const entries: LeaderboardEntry[] = memberEntries.map(([memberId, name]) => ({
    memberId,
    name,
    count: scores.get(memberId) ?? 0,
  }));

  entries.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return entries;
}

export async function getEvents(id: string): Promise<TickerEvent[]> {
  const raw = await redis.lrange<string>(keys.groupEvents(id), 0, TICKER_MAX_EVENTS - 1);
  return raw
    .map((entry) => {
      const [name, ts, type, rawCount, rawMessageIndex] = entry.split("|");
      if (!name || !ts) return null;
      const count = Number(rawCount);
      const messageIndex = Number(rawMessageIndex);
      return {
        name,
        ts: Number(ts),
        type: type === "undo" ? "undo" : "beer",
        ...(Number.isFinite(count) ? { count } : {}),
        ...(Number.isFinite(messageIndex) ? { messageIndex } : {}),
      } as TickerEvent;
    })
    .filter((e): e is TickerEvent => e !== null);
}

export async function getGroupState(id: string): Promise<GroupState | null> {
  const meta = await getGroupMeta(id);
  if (!meta) return null;

  const [total, leaderboard, events] = await Promise.all([
    redis.get<number>(keys.groupTotal(id)),
    getLeaderboard(id),
    getEvents(id),
  ]);

  return {
    meta,
    total: total ?? 0,
    leaderboard,
    events,
  };
}

export async function pushEvent(
  id: string,
  name: string,
  type: "beer" | "undo",
  count?: number
) {
  const messageIndex = Math.floor(Math.random() * 5);
  const entry = `${name}|${Date.now()}|${type}|${count ?? ""}|${messageIndex}`;
  await redis.lpush(keys.groupEvents(id), entry);
  await redis.ltrim(keys.groupEvents(id), 0, TICKER_MAX_EVENTS - 1);
}
