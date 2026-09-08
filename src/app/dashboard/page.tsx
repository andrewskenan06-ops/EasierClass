import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import SyncButton from "./SyncButton";
import AddClassForm from "./AddClassForm";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const userId = await getUserId();
  if (!userId) redirect("/");

  const feeds = await prisma.feed.findMany({
    where: { userId },
    include: {
      assignments: { orderBy: { dueAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (feeds.length === 0) redirect("/");

  const now = new Date();
  const allAssignments = feeds.flatMap((feed) =>
    feed.assignments.map((a) => ({ ...a, label: feed.label }))
  );
  const upcoming = allAssignments
    .filter((a) => !a.dueAt || a.dueAt >= now)
    .sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity));
  const past = allAssignments
    .filter((a) => a.dueAt && a.dueAt < now)
    .sort((a, b) => (b.dueAt?.getTime() ?? 0) - (a.dueAt?.getTime() ?? 0));

  const lastSync = feeds
    .map((f) => f.lastSync)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Upcoming
          </h1>
          <SyncButton />
        </div>

        {lastSync && (
          <p className="-mt-4 text-xs text-zinc-500">
            Last synced {lastSync.toLocaleString()}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {feeds.map((f) => (
            <span
              key={f.id}
              className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {f.label}
            </span>
          ))}
        </div>

        {upcoming.length === 0 ? (
          <p className="text-zinc-500">No upcoming assignments found.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-0.5 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="font-medium text-black dark:text-zinc-50">{a.title}</span>
                <span className="text-sm text-zinc-500">
                  {a.label} · {a.dueAt ? a.dueAt.toLocaleString() : "No due date"}
                </span>
              </li>
            ))}
          </ul>
        )}

        {past.length > 0 && (
          <details className="mt-2">
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
                    {a.label} · {a.dueAt ? a.dueAt.toLocaleString() : "No due date"}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <hr className="my-4 border-zinc-200 dark:border-zinc-800" />

        <AddClassForm />
      </main>
    </div>
  );
}
