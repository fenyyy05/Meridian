import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSchedule } from "@/server/actions/scheduling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen, Coffee } from "lucide-react";
import { GenerateScheduleButton } from "./GenerateScheduleButton";

export default async function PlannerPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const todayStr = new Date().toISOString();
  const schedule = await getSchedule(todayStr);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const calculateDuration = (start: Date, end: Date) => {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Planner</h1>
          <p className="text-[#6B6B6B] mt-1">Adaptive schedule for your day</p>
        </div>
        <GenerateScheduleButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#E8E4DF] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#E8E4DF] pb-4">
              <CardTitle className="text-xl flex items-center text-[#2D2D2D]">
                <Calendar className="w-5 h-5 mr-2 text-[#A7C4D4]" />
                Today's Blocks
              </CardTitle>
              {schedule?.status && (
                <Badge variant="outline" className="bg-[#FBF8F3]">
                  {schedule.status}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {!schedule || schedule.blocks.length === 0 ? (
                <div className="text-center py-12 text-[#6B6B6B]">
                  <Calendar className="w-12 h-12 mx-auto text-[#E8E4DF] mb-4" />
                  <p>You don't have a schedule for today yet.</p>
                  <p className="text-sm mt-2">Generate a smart schedule to get adaptive block recommendations.</p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E8E4DF] before:to-transparent">
                  {schedule.blocks.map((block) => {
                    const isStudy = block.blockType === "STUDY";
                    return (
                      <div key={block.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Icon */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${isStudy ? "bg-[#B8A9C9] text-white" : "bg-[#B5C9B3] text-white"}`}>
                          {isStudy ? <BookOpen className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                        </div>
                        
                        {/* Content */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[#E8E4DF] bg-white shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-semibold text-[#A7C4D4] flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(block.startTime)} - {formatTime(block.endTime)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {calculateDuration(block.startTime, block.endTime)}m
                            </Badge>
                          </div>
                          <h3 className="font-bold text-[#2D2D2D] mt-2">
                            {isStudy ? block.task?.title || "Focus Session" : "Break"}
                          </h3>
                          {block.status === "COMPLETED" && (
                            <Badge className="mt-2 bg-[#B5C9B3]">Completed</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-[#E8E4DF] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#2D2D2D]">Daily Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between pb-2 border-b border-[#E8E4DF]">
                  <span className="text-[#6B6B6B]">Total Blocks</span>
                  <span className="font-semibold text-[#2D2D2D]">{schedule?.blocks.length || 0}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E8E4DF]">
                  <span className="text-[#6B6B6B]">Study Time</span>
                  <span className="font-semibold text-[#2D2D2D]">
                    {schedule?.blocks.filter(b => b.blockType === "STUDY").reduce((acc, b) => acc + calculateDuration(b.startTime, b.endTime), 0) || 0}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Break Time</span>
                  <span className="font-semibold text-[#2D2D2D]">
                    {schedule?.blocks.filter(b => b.blockType === "BREAK").reduce((acc, b) => acc + calculateDuration(b.startTime, b.endTime), 0) || 0}m
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
