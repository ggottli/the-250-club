import { NextRequest, NextResponse } from "next/server";
import { redis, keys } from "@/lib/redis";
import { getGroupMeta, pushEvent } from "@/lib/group";
import { getCrossedMilestone } from "@/lib/content";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getGroupMeta(id);
  if (!meta) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const memberId = typeof body?.memberId === "string" ? body.memberId : "";

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required." }, { status: 400 });
  }

  const name = await redis.hget<string>(keys.groupMembers(id), memberId);
  if (!name) {
    return NextResponse.json({ error: "Join the group before adding beers." }, { status: 400 });
  }

  const newTotal = await redis.incrby(keys.groupTotal(id), 1);
  const prevTotal = newTotal - 1;
  const memberCount = await redis.zincrby(keys.groupCounts(id), 1, memberId);
  await pushEvent(id, name, "beer", memberCount);

  const milestone = getCrossedMilestone(prevTotal, newTotal, meta.goal);

  return NextResponse.json({ total: newTotal, milestone });
}
