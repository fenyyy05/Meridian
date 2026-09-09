"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateSchedule } from "@/server/actions/scheduling";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

export function GenerateScheduleButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await generateSchedule(new Date().toISOString());
      router.refresh();
    } catch (error) {
      console.error("Failed to generate schedule", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={loading}
      className="bg-[#B8A9C9] hover:bg-[#A798B8] text-white"
    >
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
      Generate Smart Schedule for Today
    </Button>
  );
}
