"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { saveResource } from "@/server/actions/resources";
import { ResourceType } from "@prisma/client";
import { Plus, UploadCloud, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AddResourceDialog({ subjects }: { subjects: { id: string, name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const type = formData.get("type") as ResourceType;
    const description = formData.get("description") as string;
    const subjectId = formData.get("subjectId") as string;
    
    let url = formData.get("url") as string;

    try {
      if (uploadMode === "file") {
        const file = fileInputRef.current?.files?.[0];
        if (file) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          
          const res = await fetch("/api/upload", {
            method: "POST",
            body: uploadData,
          });
          
          if (!res.ok) throw new Error("Upload failed");
          
          const data = await res.json();
          url = data.url;
        }
      }

      await saveResource({
        title,
        url,
        type,
        description,
        subjectId: subjectId === "none" ? undefined : subjectId,
      });
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#A7C4D4] hover:bg-[#96B3C3] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Resource</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="url" onValueChange={(v) => setUploadMode(v as "url" | "file")} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url"><LinkIcon className="w-4 h-4 mr-2"/> Web URL</TabsTrigger>
            <TabsTrigger value="file"><UploadCloud className="w-4 h-4 mr-2"/> Upload File</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Resource Title" />
          </div>
          
          {uploadMode === "url" ? (
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" type="url" required placeholder="https://..." />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input id="file" name="file" type="file" ref={fileInputRef} required className="cursor-pointer" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue="ARTICLE" required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARTICLE">Article</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="NOTES">Notes</SelectItem>
                <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                <SelectItem value="PRACTICE_PROBLEMS">Practice Problems</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjectId">Subject</Label>
            <Select name="subjectId" defaultValue="none">
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" name="description" placeholder="Notes about this resource..." />
          </div>
          <Button type="submit" className="w-full bg-[#B8A9C9] hover:bg-[#A798B8] text-white" disabled={loading}>
            {loading ? "Saving..." : "Save Resource"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
