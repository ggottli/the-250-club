import { NextRequest, NextResponse } from "next/server";
import { redis, keys } from "@/lib/redis";
import { getGroupMeta } from "@/lib/group";

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
    await redis.hsetnx(keys.groupNames(id), existingName.toLocaleLowerCase(), memberId);
    return NextResponse.json({ name: existingName });
  }

  const normalizedName = requestedName.toLocaleLowerCase();
  const matchingMember = Object.entries(members).find(
    ([, name]) => name.toLocaleLowerCase() === normalizedName
  );
  if (matchingMember) {
    await redis.hsetnx(keys.groupNames(id), normalizedName, matchingMember[0]);
    return NextResponse.json(
      {
        code: "NAME_TAKEN",
        error: `An account with this name already exists in ${meta.name}, is this you?`,
        groupName: meta.name,
        existingMemberId: matchingMember[0],
      },
      { status: 409 }
    );
  }

  // Claim the normalized name atomically so simultaneous joins cannot create duplicates.
  const claimedName = await redis.hsetnx(keys.groupNames(id), normalizedName, memberId);
  if (!claimedName) {
    const existingMemberId = await redis.hget<string>(keys.groupNames(id), normalizedName);
    return NextResponse.json(
      {
        code: "NAME_TAKEN",
        error: `An account with this name already exists in ${meta.name}, is this you?`,
        groupName: meta.name,
        existingMemberId,
      },
      { status: 409 }
    );
  }

  await redis.hset(keys.groupMembers(id), { [memberId]: requestedName });
  // Seed a zero score so the member shows up on the leaderboard immediately.
  await redis.zadd(keys.groupCounts(id), { nx: true }, { score: 0, member: memberId });

  return NextResponse.json({ name: requestedName });
}
