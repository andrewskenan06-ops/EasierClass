import ical, { VEvent } from "node-ical";
import { prisma } from "@/lib/prisma";

// Blackboard's merged calendar feed carries no course info at all (just
// title/date/uid), so we auto-tag each item by matching its title against
// keywords the user has assigned to their own Course records. Manually
// corrected assignments (courseManual) are never overwritten by this.
function matchCourse(
  title: string,
  courses: { id: string; keywords: string[] }[]
): string | null {
  const lower = title.toLowerCase();
  for (const course of courses) {
    if (course.keywords.some((kw) => kw && lower.includes(kw.toLowerCase()))) {
      return course.id;
    }
  }
  return null;
}

export async function syncFeed(feedId: string) {
  const feed = await prisma.feed.findUniqueOrThrow({ where: { id: feedId } });
  const courses = await prisma.course.findMany({
    where: { userId: feed.userId },
    select: { id: true, keywords: true },
  });

  const events = await ical.async.fromURL(feed.icalUrl);

  let count = 0;
  for (const key of Object.keys(events)) {
    const component = events[key];
    if (!component || component.type !== "VEVENT") continue;
    const event = component as VEvent;

    const uid = event.uid ?? key;
    const title = event.summary?.toString() ?? "Untitled";
    const dueAt = event.start ?? null;
    const url = (event.url as string | undefined) ?? null;
    const courseId = matchCourse(title, courses);

    const existing = await prisma.assignment.findUnique({
      where: { feedId_uid: { feedId, uid } },
      select: { courseManual: true },
    });

    await prisma.assignment.upsert({
      where: { feedId_uid: { feedId, uid } },
      update: {
        title,
        dueAt,
        url,
        ...(existing?.courseManual ? {} : { courseId }),
      },
      create: { feedId, uid, title, dueAt, url, courseId },
    });
    count++;
  }

  await prisma.feed.update({
    where: { id: feedId },
    data: { lastSync: new Date() },
  });

  return count;
}
