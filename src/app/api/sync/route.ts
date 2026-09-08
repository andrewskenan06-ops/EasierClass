import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { syncFeed } from "@/lib/syncFeed";

export async function POST() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  const feeds = await prisma.feed.findMany({ where: { userId } });
  let total = 0;
  for (const feed of feeds) {
    total += await syncFeed(feed.id);
  }

  return NextResponse.json({ ok: true, count: total });
}
