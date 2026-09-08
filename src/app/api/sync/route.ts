import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { syncFeed } from "@/lib/syncFeed";

export async function POST() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  const feed = await prisma.feed.findUnique({ where: { userId } });
  if (!feed) {
    return NextResponse.json({ error: "No feed connected" }, { status: 404 });
  }

  const count = await syncFeed(feed.id);
  return NextResponse.json({ ok: true, count });
}
