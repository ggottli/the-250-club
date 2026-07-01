import { NextRequest, NextResponse } from "next/server";
import { redis, keys } from "@/lib/redis";
import { getGroupMeta } from "@/lib/group";
import { dedupeName } from "@/lib/id";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getGroupMeta(id);
  if (!meta) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const memberId = typeof body?.memberId === "string" ? body.memberId : "";
  const requestedName = typeof body?.name === "string" ? body.name.trim() : "";

  if (!memberId || !requestedName) {
    return NextResponse.json({ error: "memberId and name are required." }, { status: 400 });
  }

  const members = (await redis.hgetall<Record<string, string>>(keys.groupMembers(id))) ?? {};

  const existingName = members[memberId];
  if (existingName) {
    return NextResponse.json({ name: existingName });
  }

  const finalName = dedupeName(requestedName, Object.values(members));
  await redis.hset(keys.groupMembers(id), { [memberId]: finalName });
  // Seed a zero score so the member shows up on the leaderboard immediately.
  await redis.zadd(keys.groupCounts(id), { nx: true }, { score: 0, member: memberId });

  return NextResponse.json({ name: finalName });
}
