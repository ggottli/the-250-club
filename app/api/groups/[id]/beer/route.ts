import { NextRequest, NextResponse } from "next/server";
import { redis, keys } from "@/lib/redis";
import { getGroupMeta, pushEvent } from "@/lib/group";
import { getCrossedMilestone } from "@/lib/content";
import { MAX_BEER_DELTA, MIN_BEER_DELTA } from "@/lib/config";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getGroupMeta(id);
  if (!meta) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const memberId = typeof body?.memberId === "string" ? body.memberId : "";
  let delta = Number(body?.delta);
  if (!Number.isFinite(delta)) delta = 1;
  delta = Math.min(MAX_BEER_DELTA, Math.max(MIN_BEER_DELTA, Math.round(delta)));

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required." }, { status: 400 });
  }

  const name = await redis.hget<string>(keys.groupMembers(id), memberId);
  if (!name) {
    return NextResponse.json({ error: "Join the group before adding beers." }, { status: 400 });
  }

  const newTotal = await redis.incrby(keys.groupTotal(id), delta);
  const prevTotal = newTotal - delta;
  await redis.zincrby(keys.groupCounts(id), delta, memberId);
  await pushEvent(id, name, "beer");

  const milestone = getCrossedMilestone(prevTotal, newTotal, meta.goal);

  return NextResponse.json({ total: newTotal, milestone });
}
