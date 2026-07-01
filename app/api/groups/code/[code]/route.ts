import { NextResponse } from "next/server";
import { redis, keys } from "@/lib/redis";

// Resolves a short join code to a groupId so the client can navigate to /g/[id].
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  const groupId = await redis.get<string>(keys.joinCode(normalized));
  if (!groupId) {
    return NextResponse.json({ error: "No group found with that code." }, { status: 404 });
  }
  return NextResponse.json({ groupId });
}
