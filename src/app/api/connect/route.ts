import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setUserId } from "@/lib/session";
import { syncFeed } from "@/lib/syncFeed";

export async function POST(req: NextRequest) {
  const { email, icalUrl } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!icalUrl || typeof icalUrl !== "string" || !icalUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "A valid iCal feed URL is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const feed = await prisma.feed.upsert({
    where: { userId: user.id },
    update: { icalUrl },
    create: { userId: user.id, icalUrl },
  });

  try {
    await syncFeed(feed.id);
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't read that feed. Double-check the URL and try again." },
      { status: 400 }
    );
  }

  await setUserId(user.id);

  return NextResponse.json({ ok: true });
}
