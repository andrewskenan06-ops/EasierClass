import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

// Unified calendar feed: assignment due-dates from the synced iCal feed, plus
// recurring weekly class meeting times, expanded into concrete occurrences
// over [from, to) so a calendar UI can render both on one grid.

type CalendarEvent = {
  id: string;
  type: "assignment" | "class";
  title: string;
  start: string; // ISO
  end: string | null; // ISO
  url: string | null;
  courseId: string | null;
  courseName: string | null;
  location: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function withTime(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = toParam ? new Date(toParam) : new Date(from.getTime() + 30 * DAY_MS);

  if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "Invalid from/to range" }, { status: 400 });
  }

  const [feed, schedule] = await Promise.all([
    prisma.feed.findUnique({
      where: { userId },
      include: {
        assignments: {
          where: { dueAt: { gte: from, lt: to } },
          include: { course: { select: { id: true, name: true } } },
          orderBy: { dueAt: "asc" },
        },
      },
    }),
    prisma.classSchedule.findMany({
      where: { course: { userId } },
      include: { course: { select: { id: true, name: true } } },
    }),
  ]);

  const events: CalendarEvent[] = [];

  for (const a of feed?.assignments ?? []) {
    events.push({
      id: `assignment:${a.id}`,
      type: "assignment",
      title: a.title,
      start: a.dueAt!.toISOString(),
      end: null,
      url: a.url,
      courseId: a.courseId,
      courseName: a.course?.name ?? null,
      location: null,
    });
  }

  // Expand each recurring class into one event per matching day-of-week in range.
  for (const s of schedule) {
    for (let d = new Date(from); d < to; d = new Date(d.getTime() + DAY_MS)) {
      if (d.getDay() !== s.dayOfWeek) continue;
      const start = withTime(d, s.startTime);
      const end = withTime(d, s.endTime);
      events.push({
        id: `class:${s.id}:${start.toISOString().slice(0, 10)}`,
        type: "class",
        title: s.course.name,
        start: start.toISOString(),
        end: end.toISOString(),
        url: null,
        courseId: s.courseId,
        courseName: s.course.name,
        location: s.location,
      });
    }
  }

  events.sort((x, y) => x.start.localeCompare(y.start));

  return NextResponse.json({
    from: from.toISOString(),
    to: to.toISOString(),
    events,
  });
}
