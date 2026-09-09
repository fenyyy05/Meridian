import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getResources, getRecommendedResources } from "@/server/actions/resources";
import { prisma } from "@/lib/prisma";
import { AddResourceDialog } from "./AddResourceDialog";
import { ResourceCard } from "./ResourceCard";
import { Library, Sparkles } from "lucide-react";

export default async function StudyHubPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const subjectId = typeof searchParams.subjectId === 'string' ? searchParams.subjectId : undefined;

  const [subjects, resources, recommendations] = await Promise.all([
    prisma.subject.findMany({ where: { userId } }),
    getResources(subjectId),
    getRecommendedResources("general study", subjectId),
  ]);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Study Hub</h1>
          <p className="text-[#6B6B6B] mt-1">Discover, save, and organize learning materials</p>
        </div>
        <AddResourceDialog subjects={subjects} />
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#2D2D2D] flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-[#E8C4C4]" />
            Recommended for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommendations.filter(rec => rec.resource).map((rec) => (
              <ResourceCard 
                key={rec.resource!.id} 
                resource={rec.resource!} 
                similarityInfo={{ score: rec.similarity_score, reason: rec.reason }}
                subjects={subjects} 
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-[#E8E4DF]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#2D2D2D] flex items-center">
            <Library className="w-5 h-5 mr-2 text-[#A7C4D4]" />
            Your Resources
          </h2>
          <div className="flex gap-2">
            <a 
              href="/study-hub" 
              className={`text-sm px-3 py-1 rounded-full border ${!subjectId ? 'bg-[#2D2D2D] text-white border-[#2D2D2D]' : 'bg-white text-[#6B6B6B] border-[#E8E4DF]'}`}
            >
              All
            </a>
            {subjects.map(s => (
              <a 
                key={s.id}
                href={`/study-hub?subjectId=${s.id}`}
                className={`text-sm px-3 py-1 rounded-full border ${subjectId === s.id ? 'bg-[#2D2D2D] text-white border-[#2D2D2D]' : 'bg-white text-[#6B6B6B] border-[#E8E4DF]'}`}
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-12 text-[#6B6B6B] bg-white border border-[#E8E4DF] rounded-xl shadow-sm">
            <Library className="w-12 h-12 mx-auto text-[#E8E4DF] mb-4" />
            <p>No resources found.</p>
            <p className="text-sm mt-2">Add your first resource to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} subjects={subjects} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
