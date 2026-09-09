'use client'

import { Button } from '@/components/ui/button'
import { Check, Clock } from 'lucide-react'
import { completeTask, postponeTask } from '@/server/actions/tasks'
import { useTransition } from 'react'

export function TaskQuickActions({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleComplete = () => {
    startTransition(async () => {
      await completeTask(taskId)
    })
  }

  const handlePostpone = () => {
    startTransition(async () => {
      await postponeTask(taskId)
    })
  }

  return (
    <div className="flex space-x-2 w-full">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex-1 border-[#E8E4DF] text-[#6B6B6B] hover:text-[#2D2D2D]"
        onClick={handlePostpone}
        disabled={isPending}
      >
        <Clock className="w-4 h-4 mr-2" />
        Postpone
      </Button>
      <Button 
        size="sm" 
        className="flex-1 bg-[#B5C9B3] hover:bg-[#B5C9B3]/90 text-[#2D2D2D]"
        onClick={handleComplete}
        disabled={isPending}
      >
        <Check className="w-4 h-4 mr-2" />
        Complete
      </Button>
    </div>
  )
}
