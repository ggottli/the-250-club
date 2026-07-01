import { Redis } from "@upstash/redis";

// The Vercel Marketplace's "Upstash for Redis" product injects REST
// credentials under legacy KV_REST_API_* names (a holdover from Vercel KV);
// some setups instead use UPSTASH_REDIS_REST_*. Accept either.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  throw new Error(
    "Missing Redis REST credentials. Set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN."
  );
}

export const redis = new Redis({ url, token });

export const keys = {
  publicGroups: "groups:public",
  groupMeta: (id: string) => `group:${id}:meta`,
  groupTotal: (id: string) => `group:${id}:total`,
  groupMembers: (id: string) => `group:${id}:members`,
  groupNames: (id: string) => `group:${id}:names`,
  groupCounts: (id: string) => `group:${id}:counts`,
  groupEvents: (id: string) => `group:${id}:events`,
};
