"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const subtaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  estimatedMinutes: z.number().int().min(5).max(240),
  difficulty: z.number().int().min(1).max(5),
  order: z.number().int().min(1),
});

const decompositionResponseSchema = z.object({
  subtasks: z.array(subtaskSchema).min(1).max(15),
});

type GeneratedSubtask = z.infer<typeof subtaskSchema>;

export async function decomposeTask(taskId: string): Promise<{
  subtasks?: GeneratedSubtask[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify task ownership
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: session.user.id },
    include: {
      subject: { select: { name: true } },
      topic: { select: { name: true } },
    },
  });

  if (!task) return { error: "Task not found" };

  // Check rate limit (10 per day per user)
  const { getLocalToday } = await import('@/lib/date-utils');
  const today = getLocalToday();
  const todayDecompositions = await prisma.prediction.count({
    where: {
      userId: session.user.id,
      type: "DISTRACTION_RISK", // Reusing prediction table for decomposition tracking
      createdAt: { gte: today },
    },
  });

  if (todayDecompositions >= 10) {
    return { error: "Daily decomposition limit reached (10 per day)" };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-placeholder") {
    return {
      error:
        "AI task decomposition is not configured. Please set the OPENAI_API_KEY environment variable.",
    };
  }

  try {
    const systemPrompt = `You are an academic task decomposition assistant. Break down academic tasks into structured, actionable subtasks.

Rules:
- Each subtask should be specific and actionable
- Estimated time should be realistic (5-240 minutes)
- Difficulty should be 1-5 (1=very easy, 5=very hard)
- Order should reflect a logical study sequence
- Generate 3-8 subtasks for most tasks
- Keep subtask titles concise but descriptive
- Consider the subject and topic context

Return ONLY valid JSON matching this schema:
{
  "subtasks": [
    {
      "title": "string",
      "description": "string (optional)",
      "estimatedMinutes": number,
      "difficulty": number (1-5),
      "order": number (starting from 1)
    }
  ]
}`;

    const userPrompt = `Break down this academic task into manageable subtasks:

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ""}
${task.subject ? `Subject: ${task.subject.name}` : ""}
${task.topic ? `Topic: ${task.topic.name}` : ""}
Estimated total time: ${task.estimatedMinutes} minutes
Difficulty: ${task.difficulty}/5`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", response.status, errorData);
      return { error: "AI service temporarily unavailable. Please try again later." };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { error: "AI returned an empty response. Please try again." };
    }

    // Parse and validate the response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { error: "AI returned an invalid response. Please try again." };
    }

    const validated = decompositionResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("Decomposition validation failed:", validated.error);
      return { error: "AI response did not match expected format. Please try again." };
    }

    return { subtasks: validated.data.subtasks };
  } catch (error) {
    console.error("Task decomposition error:", error);
    return { error: "Failed to decompose task. Please try again." };
  }
}

export async function acceptSubtasks(
  taskId: string,
  subtasks: GeneratedSubtask[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify task ownership
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: session.user.id },
  });
  if (!task) return { error: "Task not found" };

  // Create subtasks in database
  const created = await prisma.subTask.createMany({
    data: subtasks.map((st) => ({
      taskId,
      title: st.title,
      description: st.description ?? null,
      estimatedMinutes: st.estimatedMinutes,
      difficulty: st.difficulty,
      order: st.order,
      source: "AI_GENERATED" as const,
      status: "TODO" as const,
    })),
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { count: created.count };
}

export async function createManualSubtask(
  taskId: string,
  data: { title: string; estimatedMinutes?: number; difficulty?: number }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: session.user.id },
  });
  if (!task) return { error: "Task not found" };

  const maxOrder = await prisma.subTask.findFirst({
    where: { taskId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const subtask = await prisma.subTask.create({
    data: {
      taskId,
      title: data.title,
      estimatedMinutes: data.estimatedMinutes ?? 15,
      difficulty: data.difficulty ?? 3,
      order: (maxOrder?.order ?? 0) + 1,
      source: "MANUAL",
      status: "TODO",
    },
  });

  revalidatePath("/tasks");
  return { subtask };
}

export async function updateSubtaskStatus(
  subtaskId: string,
  status: "TODO" | "IN_PROGRESS" | "COMPLETED"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const subtask = await prisma.subTask.findFirst({
    where: { id: subtaskId },
    include: { task: { select: { userId: true } } },
  });

  if (!subtask || subtask.task.userId !== session.user.id) {
    return { error: "Subtask not found" };
  }

  const updated = await prisma.subTask.update({
    where: { id: subtaskId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  revalidatePath("/tasks");
  return { subtask: updated };
}

export async function deleteSubtask(subtaskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const subtask = await prisma.subTask.findFirst({
    where: { id: subtaskId },
    include: { task: { select: { userId: true } } },
  });

  if (!subtask || subtask.task.userId !== session.user.id) {
    return { error: "Subtask not found" };
  }

  await prisma.subTask.delete({ where: { id: subtaskId } });
  revalidatePath("/tasks");
  return { success: true };
}
