import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import SyncButton from "./SyncButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const userId = await getUserId();
  if (!userId) redirect("/");

  const feed = await prisma.feed.findUnique({
    where: { userId },
    include: {
      assignments: {
        orderBy: { dueAt: "asc" },
      },
    },
  });

  if (!feed) redirect("/");

  const now = new Date();
  const upcoming = feed.assignments.filter((a) => !a.dueAt || a.dueAt >= now);
  const past = feed.assignments.filter((a) => a.dueAt && a.dueAt < now);

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Upcoming
          </h1>
          <SyncButton />
        </div>

        {feed.lastSync && (
          <p className="-mt-4 text-xs text-zinc-500">
            Last synced {feed.lastSync.toLocaleString()}
          </p>
        )}

        {upcoming.length === 0 ? (
          <p className="text-zinc-500">No upcoming assignments found in your feed.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-0.5 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="font-medium text-black dark:text-zinc-50">{a.title}</span>
                <span className="text-sm text-zinc-500">
                  {a.courseName ? `${a.courseName} · ` : ""}
                  {a.dueAt ? a.dueAt.toLocaleString() : "No due date"}
                </span>
              </li>
            ))}
          </ul>
        )}

        {past.length > 0 && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-zinc-500">
              {past.length} past item{past.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-3 flex flex-col gap-2">
              {past.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-0.5 rounded-lg border border-zinc-200 bg-white px-4 py-3 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="font-medium text-black dark:text-zinc-50">{a.title}</span>
                  <span className="text-sm text-zinc-500">
                    {a.courseName ? `${a.courseName} · ` : ""}
                    {a.dueAt ? a.dueAt.toLocaleString() : "No due date"}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </main>
    </div>
  );
}
