import { Redis } from "@upstash/redis";

// Vercel's Upstash Marketplace integration injects
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN automatically.
export const redis = Redis.fromEnv();

export const keys = {
  publicGroups: "groups:public",
  groupMeta: (id: string) => `group:${id}:meta`,
  groupTotal: (id: string) => `group:${id}:total`,
  groupMembers: (id: string) => `group:${id}:members`,
  groupCounts: (id: string) => `group:${id}:counts`,
  groupEvents: (id: string) => `group:${id}:events`,
  joinCode: (code: string) => `joincode:${code}`,
};
