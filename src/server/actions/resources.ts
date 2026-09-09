"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getResourceRecommendations } from "@/server/ml-client";
import { ResourceType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getResources(subjectId?: string, topicId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const whereClause: any = {};
  if (subjectId) whereClause.subjectId = subjectId;
  if (topicId) whereClause.topicId = topicId;

  // Include only resources the user has interacted with or seeded ones, or created by them
  whereClause.OR = [
    { isSeeded: true },
    { createdByUserId: userId },
    { interactions: { some: { userId } } }
  ];

  const resources = await prisma.resource.findMany({
    where: whereClause,
    include: {
      subject: true,
      topic: true,
      interactions: {
        where: { userId },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return resources;
}

export async function saveResource({
  url,
  title,
  type,
  description,
  subjectId,
  topicId,
}: {
  url: string;
  title: string;
  type: ResourceType;
  description?: string;
  subjectId?: string;
  topicId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const resource = await prisma.resource.create({
    data: {
      url,
      title,
      type,
      description,
      subjectId,
      topicId,
      createdByUserId: userId,
      interactions: {
        create: {
          userId,
          saved: true,
        },
      },
    },
  });

  revalidatePath("/study-hub");
  return resource;
}

export async function editResource(
  id: string,
  {
    url,
    title,
    type,
    description,
    subjectId,
    topicId,
  }: {
    url?: string;
    title?: string;
    type?: ResourceType;
    description?: string;
    subjectId?: string;
    topicId?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const resource = await prisma.resource.update({
    where: { id, createdByUserId: session.user.id },
    data: {
      url,
      title,
      type,
      description,
      subjectId,
      topicId,
    },
  });

  revalidatePath("/study-hub");
  return resource;
}

export async function toggleSaveResource(resourceId: string, saved: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const userId = session.user.id;
  
  await prisma.resourceInteraction.upsert({
    where: {
      resourceId_userId: {
        resourceId,
        userId,
      },
    },
    update: {
      saved,
    },
    create: {
      resourceId,
      userId,
      saved,
    },
  });
  
  revalidatePath("/study-hub");
}

export async function markResourceCompleted(interactionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.resourceInteraction.update({
    where: { id: interactionId },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  });

  revalidatePath("/study-hub");
}

export async function rateResource(interactionId: string, rating: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.resourceInteraction.update({
    where: { id: interactionId },
    data: {
      rating,
    },
  });

  revalidatePath("/study-hub");
}

export async function getRecommendedResources(query: string, subjectId?: string, topicId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Get completed resources
  const completedInteractions = await prisma.resourceInteraction.findMany({
    where: { userId, completed: true },
    select: { resourceId: true },
  });
  const completedResourceIds = completedInteractions.map(i => i.resourceId);

  let subjectName;
  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    subjectName = subject?.name;
  }

  let topicName;
  if (topicId) {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    topicName = topic?.name;
  }

  const recommendations = await getResourceRecommendations({
    query,
    subject: subjectName,
    topic: topicName,
    completed_resource_ids: completedResourceIds,
    top_k: 5,
  });

  if (!recommendations) return [];

  // Fetch actual resource records
  const resourceIds = recommendations.map(r => r.resource_id);
  const resources = await prisma.resource.findMany({
    where: { id: { in: resourceIds } },
    include: {
      subject: true,
      topic: true,
      interactions: {
        where: { userId },
      },
    },
  });

  // Map to preserve recommendation order and inject score/reason
  return recommendations.map(rec => {
    const resource = resources.find(r => r.id === rec.resource_id);
    return {
      resource,
      similarity_score: rec.similarity_score,
      reason: rec.reason,
    };
  }).filter(r => r.resource); // Filter out any that weren't found in DB
}
