'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTask, updateTask } from '@/server/actions/tasks'
import { Label } from '@/components/ui/label'

export function CreateTaskDialog({ 
  children, 
  subjects,
  taskToEdit
}: { 
  children: React.ReactNode
  subjects: any[]
  taskToEdit?: any
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [title, setTitle] = useState(taskToEdit?.title || '')
  const [description, setDescription] = useState(taskToEdit?.description || '')
  const [subjectId, setSubjectId] = useState(taskToEdit?.subjectId || '')
  const [topicId, setTopicId] = useState(taskToEdit?.topicId || '')
  const [deadline, setDeadline] = useState(taskToEdit?.deadline ? new Date(taskToEdit.deadline).toISOString().slice(0, 16) : '')
  const [estimatedMinutes, setEstimatedMinutes] = useState(taskToEdit?.estimatedMinutes?.toString() || '30')
  const [difficulty, setDifficulty] = useState(taskToEdit?.difficulty?.toString() || '3')
  const [priority, setPriority] = useState(taskToEdit?.priority?.toString() || '3')
  
  const selectedSubject = subjects.find(s => s.id === subjectId)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const payload = {
      title,
      description: description || undefined,
      subjectId: subjectId === 'none' ? undefined : (subjectId || undefined),
      topicId: topicId === 'none' ? undefined : (topicId || undefined),
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      estimatedMinutes: parseInt(estimatedMinutes) || 30,
      difficulty: parseInt(difficulty) || 3,
      priority: parseInt(priority) || 3,
    }
    
    let res;
    if (taskToEdit) {
      res = await updateTask({ id: taskToEdit.id, ...payload })
    } else {
      res = await createTask(payload)
    }
    
    if (res?.error) {
      alert(res.error)
      setLoading(false)
      return
    }
    
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input 
              id="title"
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Read chapter 4" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="desc">Description (Optional)</Label>
            <Textarea 
              id="desc"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Details about the task..."
              className="resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject (Optional)</Label>
              <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setTopicId('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
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
              <Label>Topic (Optional)</Label>
              <Select value={topicId} onValueChange={setTopicId} disabled={!selectedSubject || selectedSubject.topics?.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {selectedSubject?.topics?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input 
              id="deadline"
              type="datetime-local" 
              value={deadline} 
              onChange={e => setDeadline(e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Est. Mins</Label>
              <Input 
                type="number" 
                min="5" 
                step="5" 
                value={estimatedMinutes} 
                onChange={e => setEstimatedMinutes(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty (1-5)</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority (1-5)</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !title}>
              {loading ? 'Saving...' : 'Save Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
