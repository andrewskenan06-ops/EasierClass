import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { syncFeed } from "@/lib/syncFeed";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  const { name, keywords } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "A class name is required" }, { status: 400 });
  }

  const keywordList: string[] = typeof keywords === "string"
    ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  await prisma.course.create({
    data: { userId, name, keywords: keywordList },
  });

  // Re-tag existing assignments against the new keyword set right away.
  const feed = await prisma.feed.findUnique({ where: { userId } });
  if (feed) await syncFeed(feed.id);

  return NextResponse.json({ ok: true });
}
