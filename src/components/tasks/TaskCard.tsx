'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, CheckCircle2, Circle, Clock, Flame, MoreHorizontal, Play, Trash, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { completeTask, postponeTask, deleteTask } from '@/server/actions/tasks'
import { decomposeTask, acceptSubtasks, updateSubtaskStatus, deleteSubtask } from '@/server/actions/decomposition'
import { CreateTaskDialog } from './CreateTaskDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-[#A7C4D4] text-white',
  IN_PROGRESS: 'bg-[#B8A9C9] text-white',
  COMPLETED: 'bg-[#B5C9B3] text-white',
  POSTPONED: 'bg-[#E8C4C4] text-[#2D2D2D]'
}

export function TaskCard({ task, subjects }: { task: any, subjects: any[] }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  
  const [showDecompose, setShowDecompose] = useState(false)
  const [isDecomposing, setIsDecomposing] = useState(false)
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<any[]>([])
  const [isAccepting, setIsAccepting] = useState(false)
  
  const handleComplete = async () => {
    await completeTask(task.id)
    router.refresh()
  }
  
  const handlePostpone = async () => {
    await postponeTask(task.id)
    router.refresh()
  }
  
  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteTask(task.id)
    setShowDelete(false)
    router.refresh()
  }

  const handleDecompose = async () => {
    setShowDecompose(true)
    setIsDecomposing(true)
    const result = await decomposeTask(task.id)
    if (result.subtasks) {
      setSuggestedSubtasks(result.subtasks)
    } else {
      console.error(result.error)
      setShowDecompose(false)
      alert(result.error || "Failed to decompose task")
    }
    setIsDecomposing(false)
  }

  const handleAcceptSubtasks = async () => {
    setIsAccepting(true)
    await acceptSubtasks(task.id, suggestedSubtasks)
    setIsAccepting(false)
    setShowDecompose(false)
    router.refresh()
  }

  const updateSuggestedTitle = (index: number, newTitle: string) => {
    const updated = [...suggestedSubtasks]
    updated[index].title = newTitle
    setSuggestedSubtasks(updated)
  }

  const removeSuggested = (index: number) => {
    const updated = [...suggestedSubtasks]
    updated.splice(index, 1)
    setSuggestedSubtasks(updated)
  }

  const formatDeadline = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24))
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-[#D4756A]' }
    if (diffDays === 0) return { text: 'Due today', color: 'text-[#D4756A]' }
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-[#2D2D2D]' }
    return { text: `Due in ${diffDays} days`, color: 'text-[#6B6B6B]' }
  }

  const deadlineInfo = formatDeadline(task.deadline)
  const isHighPriority = task.computedPriority > 0.7

  // Check if we have populated subTasks (prisma includes subTasks)
  const subtasks = task.subTasks || []

  return (
    <>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E8E4DF] hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg text-[#2D2D2D]">{task.title}</h3>
                {isHighPriority && (
                  <Badge variant="outline" className="text-[#D4756A] border-[#D4756A] flex items-center gap-1">
                    <Flame className="w-3 h-3" /> High Priority
                  </Badge>
                )}
                <Badge className={STATUS_COLORS[task.status] || 'bg-gray-200'}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-[#6B6B6B] flex-wrap">
                {task.subject && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.subject.color }} />
                    {task.subject.name}
                  </span>
                )}
                {task.topic && (
                  <span className="bg-[#FBF8F3] px-2 py-0.5 rounded text-xs border border-[#E8E4DF]">
                    {task.topic.name}
                  </span>
                )}
                {deadlineInfo && (
                  <span className={`flex items-center gap-1 ${deadlineInfo.color}`}>
                    <Calendar className="w-3 h-3" />
                    {deadlineInfo.text}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="font-medium text-[#2D2D2D]">{task.difficulty}</span>
                  <span className="text-xs">/ 5 Diff</span>
                </span>
                {(task._count?.subTasks > 0 || subtasks.length > 0) && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {subtasks.length > 0 
                      ? `${subtasks.filter((s: any) => s.status === 'COMPLETED').length}/${subtasks.length} subtasks`
                      : `${task._count.subTasks} subtasks`
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {task.description && (
            <p className="text-sm text-[#6B6B6B] line-clamp-2">{task.description}</p>
          )}

          {/* Render Subtasks if available */}
          {subtasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed border-[#E8E4DF] space-y-2">
              <h4 className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider">Subtasks</h4>
              {subtasks.map((st: any) => (
                <div key={st.id} className="flex items-center gap-2 text-sm group/st">
                  <button 
                    onClick={async () => {
                      await updateSubtaskStatus(st.id, st.status === 'COMPLETED' ? 'TODO' : 'COMPLETED')
                      router.refresh()
                    }}
                    className="text-[#6B6B6B] hover:text-[#B5C9B3] focus:outline-none"
                  >
                    {st.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4 text-[#B5C9B3]" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <span className={st.status === 'COMPLETED' ? 'line-through text-[#9B9B9B]' : 'text-[#2D2D2D]'}>
                    {st.title}
                  </span>
                  <span className="text-xs text-[#9B9B9B] ml-auto bg-[#FBF8F3] px-1.5 py-0.5 rounded border border-[#E8E4DF]">
                    {st.estimatedMinutes}m
                  </span>
                  <button 
                    onClick={async () => {
                      await deleteSubtask(st.id)
                      router.refresh()
                    }}
                    className="opacity-0 group-hover/st:opacity-100 text-red-400 hover:text-red-600 focus:outline-none"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-[#E8E4DF] pt-4 md:pt-0 md:pl-4">
          <div className="flex items-center gap-2">
            {task.status !== 'COMPLETED' && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-[#B5C9B3] hover:bg-[#B5C9B3]/10 hover:text-[#B5C9B3]"
                onClick={handleComplete}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
              </Button>
            )}
            <Button 
              size="sm"
              onClick={() => router.push(`/focus?taskId=${task.id}`)}
              className="bg-[#2D2D2D] hover:bg-[#404040]"
            >
              <Play className="w-4 h-4 mr-1" /> Focus
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <CreateTaskDialog subjects={subjects} taskToEdit={task}>
                  <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    Edit Task
                  </div>
                </CreateTaskDialog>
                
                {task.status !== 'COMPLETED' && subtasks.length === 0 && (
                  <DropdownMenuItem onClick={handleDecompose} className="text-[#A7C4D4] focus:text-[#A7C4D4] focus:bg-[#A7C4D4]/10">
                    <Sparkles className="w-4 h-4 mr-2" /> Decompose with AI
                  </DropdownMenuItem>
                )}

                {task.status !== 'COMPLETED' && (
                  <DropdownMenuItem onClick={handlePostpone}>
                    Postpone
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[#D4756A] focus:text-[#D4756A] focus:bg-red-50" onClick={() => setShowDelete(true)}>
                  <Trash className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B6B6B]">Are you sure you want to delete "{task.title}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDecompose} onOpenChange={(open) => !isDecomposing && !isAccepting && setShowDecompose(open)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#A7C4D4]" />
              AI Task Decomposition
            </DialogTitle>
            <DialogDescription>
              {isDecomposing ? "Analyzing task and generating a structured subtask list..." : "Review and edit the suggested subtasks before accepting."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isDecomposing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A7C4D4]"></div>
                <p className="text-sm text-[#6B6B6B]">Breaking down your task...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {suggestedSubtasks.map((st, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-[#FBF8F3] p-3 rounded-lg border border-[#E8E4DF]">
                    <div className="bg-[#B8A9C9] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input 
                        value={st.title} 
                        onChange={(e) => updateSuggestedTitle(idx, e.target.value)}
                        className="h-8 text-sm bg-white"
                      />
                      <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {st.estimatedMinutes}m</span>
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {st.difficulty}/5</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeSuggested(idx)}
                      className="text-[#9B9B9B] hover:text-[#D4756A] mt-1 shrink-0"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {suggestedSubtasks.length === 0 && !isDecomposing && (
                  <p className="text-sm text-center text-[#6B6B6B] py-4">No subtasks generated.</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecompose(false)} disabled={isDecomposing || isAccepting}>
              Cancel
            </Button>
            <Button 
              className="bg-[#2D2D2D] hover:bg-[#404040] text-white" 
              onClick={handleAcceptSubtasks} 
              disabled={isDecomposing || isAccepting || suggestedSubtasks.length === 0}
            >
              {isAccepting ? "Accepting..." : "Accept Subtasks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
