import { NextResponse } from "next/server";
import { redis, keys } from "@/lib/redis";
import { getGroupMeta } from "@/lib/group";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getGroupMeta(id);
  if (!meta) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  await Promise.all([
    redis.set(keys.groupTotal(id), 0),
    redis.del(keys.groupCounts(id)),
    redis.del(keys.groupEvents(id)),
  ]);

  return NextResponse.json({ ok: true });
}
