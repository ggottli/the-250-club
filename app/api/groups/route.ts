import { NextRequest, NextResponse } from "next/server";
import { redis, keys } from "@/lib/redis";
import { generateGroupId } from "@/lib/id";
import { DEFAULT_GOAL } from "@/lib/config";
import type { PublicGroupSummary } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  let goal = Number(body?.goal);
  if (!Number.isFinite(goal) || goal <= 0) goal = DEFAULT_GOAL;
  goal = Math.round(goal);

  if (!name) {
    return NextResponse.json({ error: "Group name is required." }, { status: 400 });
  }

  let groupId = generateGroupId(name);
  for (let attempts = 0; attempts < 5; attempts++) {
    const exists = await redis.exists(keys.groupMeta(groupId));
    if (!exists) break;
    groupId = generateGroupId(name);
  }

  const createdAt = Date.now();

  await redis.hset(keys.groupMeta(groupId), {
    name,
    goal,
    createdAt,
  });
  await redis.set(keys.groupTotal(groupId), 0);
  await redis.sadd(keys.publicGroups, groupId);

  return NextResponse.json({ groupId });
}

export async function GET() {
  const groupIds = await redis.smembers(keys.publicGroups);

  const summaries = await Promise.all(
    groupIds.map(async (id): Promise<PublicGroupSummary | null> => {
      const [rawMeta, total, memberCount] = await Promise.all([
        redis.hgetall<Record<string, string | number>>(keys.groupMeta(id)),
        redis.get<number>(keys.groupTotal(id)),
        redis.hlen(keys.groupMembers(id)),
      ]);
      if (!rawMeta || !rawMeta.name) return null;
      const goal = Number(rawMeta.goal) || DEFAULT_GOAL;
      return {
        id,
        name: String(rawMeta.name),
        total: total ?? 0,
        goal,
        memberCount: memberCount ?? 0,
      };
    })
  );

  const groups = summaries
    .filter((g): g is PublicGroupSummary => g !== null)
    .sort((a, b) => b.total / b.goal - a.total / a.goal);

  return NextResponse.json({ groups });
}
