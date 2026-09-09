"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { predictDistractionRisk } from "@/server/ml-client";
import { BlockType, BlockStatus, ScheduleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function generateSchedule(dateStr: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const { getLocalStartOfDay } = await import('@/lib/date-utils');
  const targetDate = getLocalStartOfDay(dateStr);

  // Fetch user profile and tasks
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      tasks: {
        where: {
          status: "TODO",
        },
        orderBy: [
          { priority: "desc" },
          { deadline: "asc" },
        ],
      },
    },
  });

  if (!user || !user.profile) {
    throw new Error("User profile not found");
  }

  const {
    preferredStudyStart = "09:00",
    preferredStudyEnd = "17:00",
    focusDuration = 25,
    breakDuration = 5,
    dailyGoalMinutes = 120,
  } = user.profile;

  // Parse start and end times
  const [startHour, startMin] = (preferredStudyStart || "09:00").split(":").map(Number);
  const [endHour, endMin] = (preferredStudyEnd || "17:00").split(":").map(Number);

  let currentTime = new Date(targetDate.getTime() + (startHour * 60 + startMin) * 60000);
  const endTime = new Date(targetDate.getTime() + (endHour * 60 + endMin) * 60000);

  // Use ML to predict distraction risk (dummy input values for context)
  const risk = await predictDistractionRisk({
    hour_of_day: startHour,
    day_of_week: targetDate.getDay(),
    recent_distraction_count: 0,
    recent_distraction_duration_min: 0,
    prev_session_duration_min: focusDuration,
    prev_focus_score: 80,
    interruption_count: 0,
    task_difficulty: 3,
    historical_completion_rate: 0.8,
    postponed_task_count: 0,
    recent_productivity_score: 85,
    recent_unfinished_tasks: user.tasks.length,
  });

  // If risk is HIGH, maybe shorten focus duration
  const actualFocusDuration = risk?.risk_level === "HIGH" ? Math.max(15, focusDuration - 10) : focusDuration;
  const actualBreakDuration = risk?.risk_level === "HIGH" ? breakDuration + 5 : breakDuration;

  const blocks: {
    taskId?: string;
    startTime: Date;
    endTime: Date;
    blockType: BlockType;
    status: BlockStatus;
  }[] = [];

  let remainingGoal = dailyGoalMinutes;
  let taskIndex = 0;

  while (currentTime < endTime && remainingGoal > 0) {
    // Study Block
    const blockEnd = new Date(currentTime.getTime() + actualFocusDuration * 60000);
    if (blockEnd > endTime) break;

    if (taskIndex < user.tasks.length) {
      const task = user.tasks[taskIndex];
      blocks.push({
        taskId: task.id,
        startTime: new Date(currentTime),
        endTime: blockEnd,
        blockType: BlockType.STUDY,
        status: BlockStatus.SCHEDULED,
      });
      taskIndex++;
    } else {
      blocks.push({
        startTime: new Date(currentTime),
        endTime: blockEnd,
        blockType: BlockType.STUDY,
        status: BlockStatus.SCHEDULED,
      });
    }

    currentTime = new Date(blockEnd.getTime());
    remainingGoal -= actualFocusDuration;

    // Break Block
    if (remainingGoal > 0 && currentTime < endTime) {
      const breakEnd = new Date(currentTime.getTime() + actualBreakDuration * 60000);
      blocks.push({
        startTime: new Date(currentTime),
        endTime: breakEnd,
        blockType: BlockType.BREAK,
        status: BlockStatus.SCHEDULED,
      });
      currentTime = new Date(breakEnd.getTime());
    }
  }

  // Find existing schedule or create
  let schedule = await prisma.schedule.findUnique({
    where: {
      userId_date: {
        userId,
        date: targetDate,
      },
    },
  });

  if (schedule) {
    // Delete existing blocks to regenerate
    await prisma.scheduleBlock.deleteMany({
      where: { scheduleId: schedule.id },
    });
    schedule = await prisma.schedule.update({
      where: { id: schedule.id },
      data: { status: ScheduleStatus.ACTIVE },
    });
  } else {
    schedule = await prisma.schedule.create({
      data: {
        userId,
        date: targetDate,
        status: ScheduleStatus.ACTIVE,
      },
    });
  }

  // Create blocks
  if (blocks.length > 0) {
    await prisma.scheduleBlock.createMany({
      data: blocks.map((b) => ({
        ...b,
        scheduleId: schedule!.id,
      })),
    });
  }

  revalidatePath("/planner");
  return { success: true, scheduleId: schedule.id };
}

export async function getSchedule(dateStr: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { getLocalStartOfDay } = await import('@/lib/date-utils');
  const targetDate = getLocalStartOfDay(dateStr);

  const schedule = await prisma.schedule.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: targetDate,
      },
    },
    include: {
      blocks: {
        include: {
          task: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  return schedule;
}
