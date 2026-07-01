import { NextResponse } from "next/server";
import { getGroupState } from "@/lib/group";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getGroupState(id);
  if (!state) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }
  return NextResponse.json(state);
}
