import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Not connected" }, { status: 401 });

  const { id } = await params;
  const { courseId } = await req.json();

  // Make sure this assignment actually belongs to the caller's own feed.
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { feed: true },
  });
  if (!assignment || assignment.feed.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.userId !== userId) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }
  }

  await prisma.assignment.update({
    where: { id },
    data: { courseId: courseId || null, courseManual: true },
  });

  return NextResponse.json({ ok: true });
}
