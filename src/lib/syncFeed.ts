import ical, { VEvent } from "node-ical";
import { prisma } from "@/lib/prisma";

// Pulls the ICS feed at feed.icalUrl and upserts each VEVENT as an Assignment.
export async function syncFeed(feedId: string) {
  const feed = await prisma.feed.findUniqueOrThrow({ where: { id: feedId } });

  const events = await ical.async.fromURL(feed.icalUrl);

  let count = 0;
  for (const key of Object.keys(events)) {
    const component = events[key];
    if (!component || component.type !== "VEVENT") continue;
    const event = component as VEvent;

    const uid = event.uid ?? key;
    const title = event.summary?.toString() ?? "Untitled";
    // Blackboard typically prefixes the course name in the summary, e.g. "CISC 3400: HW 3"
    const [maybeCourse, ...rest] = title.split(":");
    const courseName = rest.length > 0 ? maybeCourse.trim() : null;

    await prisma.assignment.upsert({
      where: { feedId_uid: { feedId, uid } },
      update: {
        title,
        courseName,
        dueAt: event.start ?? null,
        url: (event.url as string | undefined) ?? null,
      },
      create: {
        feedId,
        uid,
        title,
        courseName,
        dueAt: event.start ?? null,
        url: (event.url as string | undefined) ?? null,
      },
    });
    count++;
  }

  await prisma.feed.update({
    where: { id: feedId },
    data: { lastSync: new Date() },
  });

  return count;
}
