"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2, Bookmark, BookmarkCheck } from "lucide-react";
import { markResourceCompleted, toggleSaveResource } from "@/server/actions/resources";
import { useTransition } from "react";
import { EditResourceDialog } from "./EditResourceDialog";

export function ResourceCard({ resource, similarityInfo, subjects }: { resource: any, similarityInfo?: any, subjects?: { id: string, name: string }[] }) {
  const [isPending, startTransition] = useTransition();

  const interaction = resource.interactions?.[0];
  const isSaved = interaction?.saved || false;
  const isCompleted = interaction?.completed || false;

  const handleSaveToggle = () => {
    startTransition(() => {
      toggleSaveResource(resource.id, !isSaved);
    });
  };

  const handleComplete = () => {
    if (interaction?.id && !isCompleted) {
      startTransition(() => {
        markResourceCompleted(interaction.id);
      });
    }
  };

  return (
    <Card className="border-[#E8E4DF] shadow-sm flex flex-col h-full bg-white">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg text-[#2D2D2D] line-clamp-2">
            {resource.title}
          </CardTitle>
          <div className="flex gap-1 -mr-2 -mt-2">
            {subjects && (
              <EditResourceDialog resource={resource} subjects={subjects} />
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-[#A7C4D4] hover:text-[#96B3C3] hover:bg-transparent"
              onClick={handleSaveToggle}
              disabled={isPending}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs bg-[#FBF8F3]">
            {resource.type}
          </Badge>
          {resource.subject && (
            <Badge variant="outline" style={{ borderColor: resource.subject.color, color: resource.subject.color }} className="text-xs">
              {resource.subject.name}
            </Badge>
          )}
          {similarityInfo && (
            <Badge variant="secondary" className="text-xs bg-[#E8C4C4]/20 text-[#D4756A]">
              Recommended
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        {resource.description && (
          <p className="text-sm text-[#6B6B6B] line-clamp-3 mb-2">
            {resource.description}
          </p>
        )}
        {similarityInfo?.reason && (
          <p className="text-xs italic text-[#A7C4D4] mt-2 border-l-2 border-[#A7C4D4] pl-2">
            "{similarityInfo.reason}"
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2 border-t border-[#E8E4DF] mt-auto">
        {resource.url ? (
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-[#B8A9C9] hover:underline">
            <ExternalLink className="w-4 h-4 mr-1" />
            Open Link
          </a>
        ) : (
          <span className="text-sm text-[#6B6B6B]">No link provided</span>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleComplete}
          disabled={isCompleted || isPending || !interaction?.id}
          className={isCompleted ? "text-[#B5C9B3]" : "text-[#6B6B6B]"}
        >
          <CheckCircle2 className={`w-4 h-4 mr-1 ${isCompleted ? "fill-[#B5C9B3] text-white" : ""}`} />
          {isCompleted ? "Completed" : "Mark Done"}
        </Button>
      </CardFooter>
    </Card>
  );
}
