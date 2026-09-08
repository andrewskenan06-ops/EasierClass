"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Course = { id: string; name: string };

export default function CourseSelect({
  assignmentId,
  courses,
  currentCourseId,
}: {
  assignmentId: string;
  courses: Course[];
  currentCourseId: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSaving(true);
    await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: e.target.value || null }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      defaultValue={currentCourseId ?? ""}
      onChange={handleChange}
      disabled={saving}
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
    >
      <option value="">Unassigned</option>
      {courses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
