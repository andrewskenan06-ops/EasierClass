type ScheduleEntry = {
  id: string;
  courseId: string;
  startTime: string;
  endTime: string;
  location: string | null;
  course: { id: string; name: string };
};

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export default function TodayPanel({ todaySchedule }: { todaySchedule: ScheduleEntry[] }) {
  if (todaySchedule.length === 0) return null;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const sorted = [...todaySchedule].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
  );

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-zinc-500">Today</h2>
      <ul className="flex flex-col gap-2">
        {sorted.map((s) => {
          const start = toMinutes(s.startTime);
          const end = toMinutes(s.endTime);
          const isNow = nowMinutes >= start && nowMinutes < end;
          const isPast = nowMinutes >= end;

          return (
            <li
              key={s.id}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                isNow
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : isPast
                    ? "border-zinc-200 bg-white opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{s.course.name}</span>
                <span
                  className={`text-sm ${isNow ? "opacity-80" : "text-zinc-500"}`}
                >
                  {s.startTime}–{s.endTime}
                  {s.location ? ` · ${s.location}` : ""}
                </span>
              </div>
              {isNow && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold dark:bg-black/10">
                  Now
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
