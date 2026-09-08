import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

// Recurring weekly class meeting times (e.g. "CS101 meets Mon/Wed 10:00-10:50"),
// distinct from Assignment (due-date items pulled from the iCal feed).

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  const schedule = await prisma.classSchedule.findMany({
    where: { course: { userId } },
    include: { course: { select: { id: true, name: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ schedule });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  const { courseId, dayOfWeek, startTime, endTime, location } = await req.json();

  if (!courseId || typeof courseId !== "string") {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }
  if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: "dayOfWeek must be 0 (Sun) - 6 (Sat)" }, { status: 400 });
  }
  if (typeof startTime !== "string" || !TIME_RE.test(startTime)) {
    return NextResponse.json({ error: "startTime must be HH:mm" }, { status: 400 });
  }
  if (typeof endTime !== "string" || !TIME_RE.test(endTime)) {
    return NextResponse.json({ error: "endTime must be HH:mm" }, { status: 400 });
  }
  if (endTime <= startTime) {
    return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
  }

  // Only let a user attach a schedule to their own course.
  const course = await prisma.course.findFirst({ where: { id: courseId, userId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const entry = await prisma.classSchedule.create({
    data: {
      courseId,
      dayOfWeek,
      startTime,
      endTime,
      location: typeof location === "string" && location.trim() ? location.trim() : null,
    },
  });

  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  const { id } = await req.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const entry = await prisma.classSchedule.findFirst({
    where: { id, course: { userId } },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.classSchedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
