import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, setUserId } from "@/lib/session";
import { syncFeed } from "@/lib/syncFeed";

export async function POST(req: NextRequest) {
  const { email, label, icalUrl } = await req.json();

  if (!label || typeof label !== "string") {
    return NextResponse.json({ error: "A course name is required" }, { status: 400 });
  }
  if (!icalUrl || typeof icalUrl !== "string" || !icalUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "A valid iCal feed URL is required" },
      { status: 400 }
    );
  }

  let userId = await getUserId();

  if (!userId) {
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    userId = user.id;
    await setUserId(userId);
  }

  const feed = await prisma.feed.upsert({
    where: { userId_icalUrl: { userId, icalUrl } },
    update: { label },
    create: { userId, icalUrl, label },
  });

  try {
    await syncFeed(feed.id);
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't read that feed. Double-check the URL and try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
