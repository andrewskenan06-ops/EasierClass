import ical, { VEvent } from "node-ical";
import { prisma } from "@/lib/prisma";

// Pulls the ICS feed at feed.icalUrl and upserts each VEVENT as an Assignment.
// Note: Blackboard's per-course feed already scopes every event to one class,
// so we don't need to parse a course name out of the title here.
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

    await prisma.assignment.upsert({
      where: { feedId_uid: { feedId, uid } },
      update: {
        title,
        dueAt: event.start ?? null,
        url: (event.url as string | undefined) ?? null,
      },
      create: {
        feedId,
        uid,
        title,
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
