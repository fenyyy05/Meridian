'use client'

import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickStartButton({ taskId }: { taskId?: string }) {
  const router = useRouter()

  const handleStart = () => {
    if (taskId) {
      router.push(`/focus?taskId=${taskId}`)
    } else {
      router.push('/focus')
    }
  }

  return (
    <Button 
      onClick={handleStart} 
      size="sm" 
      className="bg-[#A7C4D4] hover:bg-[#A7C4D4]/90 text-[#2D2D2D] w-full"
    >
      <Play className="w-4 h-4 mr-2" />
      Start Focus
    </Button>
  )
}
