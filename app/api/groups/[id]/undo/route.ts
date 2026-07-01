import { NextRequest, NextResponse } from "next/server";
import { redis, keys } from "@/lib/redis";
import { getGroupMeta, pushEvent } from "@/lib/group";

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
    return NextResponse.json({ error: "Join the group before undoing a beer." }, { status: 400 });
  }

  const currentScore = (await redis.zscore(keys.groupCounts(id), memberId)) ?? 0;
  if (currentScore <= 0) {
    const total = (await redis.get<number>(keys.groupTotal(id))) ?? 0;
    return NextResponse.json({ total });
  }

  await redis.zincrby(keys.groupCounts(id), -1, memberId);

  const currentTotal = (await redis.get<number>(keys.groupTotal(id))) ?? 0;
  const newTotal = currentTotal > 0 ? await redis.decrby(keys.groupTotal(id), 1) : 0;

  await pushEvent(id, name, "undo");

  return NextResponse.json({ total: newTotal });
}
