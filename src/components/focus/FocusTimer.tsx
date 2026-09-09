'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, SkipForward, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { startSession, endSession, logDistraction, getRecentSessions } from '@/server/actions/sessions'
import { getTasks } from '@/server/actions/tasks'
import { Textarea } from '@/components/ui/textarea'

type Task = {
  id: string
  title: string
  subject?: { name: string; color: string } | null
}

type SessionState = 'IDLE' | 'FOCUSING' | 'PAUSED' | 'BREAK'

const FOCUS_PRESETS = [15, 25, 45, 50]
const BREAK_DURATION = 5 * 60 * 1000

export function FocusTimer() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>('none')
  const [durationPreset, setDurationPreset] = useState<number>(25)
  
  const [sessionState, setSessionState] = useState<SessionState>('IDLE')
  const [remainingMs, setRemainingMs] = useState<number>(25 * 60 * 1000)
  const targetEndTime = useRef<number | null>(null)
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [showDistractionDialog, setShowDistractionDialog] = useState(false)
  
  const [focusScore, setFocusScore] = useState<number>(3)
  const [notes, setNotes] = useState('')
  const [distractions, setDistractions] = useState<number>(0)
  type DistractionCategory = 'SOCIAL_MEDIA' | 'YOUTUBE' | 'MESSAGING' | 'GAMING' | 'NOTIFICATIONS' | 'ENVIRONMENT' | 'TAB_SWITCH' | 'OTHER'
  const [distractionCategory, setDistractionCategory] = useState<DistractionCategory>('SOCIAL_MEDIA')
  
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    async function load() {
      const tsks = await getTasks({ status: 'TODO' })
      const inProg = await getTasks({ status: 'IN_PROGRESS' })
      setTasks([...tsks, ...inProg])
      
      const sessions = await getRecentSessions(5)
      setRecentSessions(sessions)
    }
    load()
  }, [])
  
  useEffect(() => {
    if (sessionState === 'IDLE' && remainingMs === 0) {
      setRemainingMs(durationPreset * 60 * 1000)
    }
  }, [durationPreset, sessionState, remainingMs])
  
  // Visibility handling
  const lastHiddenTime = useRef<number | null>(null)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        lastHiddenTime.current = Date.now()
      } else {
        if (sessionState === 'FOCUSING') {
          if (lastHiddenTime.current) {
            const awayTime = Date.now() - lastHiddenTime.current
            if (awayTime > 10000) {
              setDistractions(d => d + 1)
              if (activeSessionId) {
                logDistraction({
                  sessionId: activeSessionId,
                  category: 'OTHER',
                  description: 'Auto-detected tab switch (>10s)'
                })
              }
            }
          }
        }
        lastHiddenTime.current = null
        if ((sessionState === 'FOCUSING' || sessionState === 'BREAK') && targetEndTime.current) {
          setRemainingMs(Math.max(0, targetEndTime.current - Date.now()))
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [sessionState, activeSessionId])
  
  // Timer loop
  useEffect(() => {
    if (sessionState === 'FOCUSING' || sessionState === 'BREAK') {
      timerInterval.current = setInterval(() => {
        if (targetEndTime.current) {
          const rem = Math.max(0, targetEndTime.current - Date.now())
          setRemainingMs(rem)
          
          if (rem <= 0) {
            handleTimerComplete()
          }
        }
      }, 250)
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
    
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [sessionState])
  
  // Document title
  useEffect(() => {
    if (sessionState === 'FOCUSING' || sessionState === 'BREAK') {
      const mins = Math.floor(remainingMs / 60000)
      const secs = Math.floor((remainingMs % 60000) / 1000)
      document.title = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} | ${sessionState === 'FOCUSING' ? 'Focus' : 'Break'} | Meridian`
    } else {
      document.title = 'Meridian'
    }
  }, [remainingMs, sessionState])
  
  const handleTimerComplete = async () => {
    if (sessionState === 'FOCUSING') {
      setSessionState('BREAK')
      setRemainingMs(BREAK_DURATION)
      targetEndTime.current = Date.now() + BREAK_DURATION
      new Audio('/notification.mp3').play().catch(() => {})
      setShowEndDialog(true)
    } else if (sessionState === 'BREAK') {
      setSessionState('IDLE')
      setRemainingMs(durationPreset * 60 * 1000)
      targetEndTime.current = null
      new Audio('/notification.mp3').play().catch(() => {})
    }
  }

  const startFocus = async () => {
    const res = await startSession({
      taskId: selectedTaskId !== 'none' ? selectedTaskId : undefined,
      plannedDuration: durationPreset
    })
    if (res.session) {
      setActiveSessionId(res.session.id)
    }
    setSessionState('FOCUSING')
    setRemainingMs(durationPreset * 60 * 1000)
    targetEndTime.current = Date.now() + durationPreset * 60 * 1000
    setDistractions(0)
    setNotes('')
  }
  
  const pauseFocus = () => {
    setSessionState('PAUSED')
    targetEndTime.current = null
  }
  
  const resumeFocus = () => {
    setSessionState('FOCUSING')
    targetEndTime.current = Date.now() + remainingMs
  }
  
  const stopFocus = () => {
    setSessionState('IDLE')
    targetEndTime.current = null
    if (activeSessionId) {
      setShowEndDialog(true)
    } else {
      setRemainingMs(durationPreset * 60 * 1000)
    }
  }
  
  const skipToBreak = () => {
    setSessionState('BREAK')
    setRemainingMs(BREAK_DURATION)
    targetEndTime.current = Date.now() + BREAK_DURATION
    if (activeSessionId) setShowEndDialog(true)
  }
  
  const skipBreak = () => {
    setSessionState('IDLE')
    setRemainingMs(durationPreset * 60 * 1000)
    targetEndTime.current = null
  }
  
  const handleEndSession = async (status: 'COMPLETED' | 'INTERRUPTED') => {
    if (activeSessionId) {
      await endSession({
        sessionId: activeSessionId,
        focusScore,
        notes: notes || undefined,
        status
      })
      setActiveSessionId(null)
      // refresh sessions
      const sessions = await getRecentSessions(5)
      setRecentSessions(sessions)
    }
    setShowEndDialog(false)
    if (sessionState === 'IDLE') {
      setRemainingMs(durationPreset * 60 * 1000)
    }
  }
  
  const handleLogDistraction = async () => {
    if (activeSessionId) {
      await logDistraction({
        sessionId: activeSessionId,
        category: distractionCategory
      })
      setDistractions(d => d + 1)
    }
    setShowDistractionDialog(false)
  }

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  
  const isFocusing = sessionState === 'FOCUSING' || sessionState === 'PAUSED'
  const isBreak = sessionState === 'BREAK'
  
  const totalMs = isBreak ? BREAK_DURATION : durationPreset * 60 * 1000
  const progress = 1 - (remainingMs / totalMs)
  
  const strokeColor = isBreak ? '#B5C9B3' : '#B8A9C9'
  
  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      {sessionState === 'IDLE' && (
        <div className="w-full mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a task to focus on" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific task</SelectItem>
              {tasks.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            {FOCUS_PRESETS.map(p => (
              <Button 
                key={p} 
                variant={durationPreset === p ? 'default' : 'outline'} 
                size="sm"
                onClick={() => {
                  setDurationPreset(p)
                  setRemainingMs(p * 60 * 1000)
                }}
              >
                {p}m
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {sessionState !== 'IDLE' && (
        <div className="text-xl font-medium text-[#2D2D2D] mb-4">
          {isBreak ? 'Break Time' : 'Focusing...'}
        </div>
      )}
      
      <div className="relative w-72 h-72 mb-8 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0">
          <circle 
            cx="144" cy="144" r="130" 
            fill="none" stroke="#E8E4DF" strokeWidth="8" 
          />
          <circle 
            cx="144" cy="144" r="130" 
            fill="none" stroke={strokeColor} strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 130}
            strokeDashoffset={2 * Math.PI * 130 * (1 - progress)}
            className="transition-all duration-200"
          />
        </svg>
        <div className="text-6xl font-mono text-[#2D2D2D] z-10">
          {formatTime(remainingMs)}
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-8">
        {sessionState === 'IDLE' && (
          <Button onClick={startFocus} size="lg" className="w-32 bg-[#2D2D2D] hover:bg-[#404040]">
            <Play className="w-5 h-5 mr-2" /> Start
          </Button>
        )}
        
        {sessionState === 'FOCUSING' && (
          <>
            <Button onClick={pauseFocus} variant="outline" size="lg">
              <Pause className="w-5 h-5 mr-2" /> Pause
            </Button>
            <Button onClick={stopFocus} variant="outline" size="lg" className="text-[#D4756A] hover:text-[#D4756A] hover:bg-red-50">
              <Square className="w-5 h-5 mr-2" /> Stop
            </Button>
            <Button onClick={skipToBreak} variant="ghost" size="icon">
              <SkipForward className="w-5 h-5 text-[#6B6B6B]" />
            </Button>
          </>
        )}
        
        {sessionState === 'PAUSED' && (
          <>
            <Button onClick={resumeFocus} size="lg">
              <Play className="w-5 h-5 mr-2" /> Resume
            </Button>
            <Button onClick={stopFocus} variant="outline" size="lg" className="text-[#D4756A] hover:text-[#D4756A] hover:bg-red-50">
              <Square className="w-5 h-5 mr-2" /> Stop
            </Button>
          </>
        )}
        
        {sessionState === 'BREAK' && (
          <>
            <Button onClick={skipBreak} variant="outline" size="lg">
              <SkipForward className="w-5 h-5 mr-2" /> Skip Break
            </Button>
          </>
        )}
      </div>
      
      {isFocusing && (
        <div className="flex flex-col items-center">
          <Button 
            variant="ghost" 
            className="text-[#6B6B6B] hover:text-[#2D2D2D]"
            onClick={() => setShowDistractionDialog(true)}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Log Distraction
          </Button>
          {distractions > 0 && (
            <span className="text-sm mt-1 text-[#D4756A]">{distractions} logged</span>
          )}
        </div>
      )}
      
      <div className="w-full mt-12 border-t border-[#E8E4DF] pt-8">
        <h3 className="font-semibold text-[#2D2D2D] mb-4">Recent Sessions</h3>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">No recent sessions.</p>
        ) : (
          <div className="space-y-3">
            {recentSessions.map(rs => (
              <div key={rs.id} className="flex justify-between items-center bg-[#FBF8F3] p-3 rounded-lg text-sm border border-[#E8E4DF]">
                <div>
                  <div className="font-medium text-[#2D2D2D]">{rs.task?.title || 'Unfocused Session'}</div>
                  <div className="text-xs text-[#6B6B6B]">{new Date(rs.startTime).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{rs.actualDuration} min</div>
                  <div className="text-xs text-[#6B6B6B]">Score: {rs.focusScore || '-'} / 5</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Dialog open={showEndDialog} onOpenChange={(open) => !open && setShowEndDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Completed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-[#6B6B6B] text-sm">Great job! How was your focus?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(score => (
                <Button
                  key={score}
                  variant={focusScore === score ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFocusScore(score)}
                >
                  {score}
                </Button>
              ))}
            </div>
            {distractions > 0 && (
              <p className="text-sm text-[#D4756A]">You logged {distractions} distractions.</p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2D2D2D]">Notes (optional)</label>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="What did you accomplish?"
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleEndSession('INTERRUPTED')}>Discard</Button>
            <Button onClick={() => handleEndSession('COMPLETED')}>Save Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDistractionDialog} onOpenChange={setShowDistractionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Distraction</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {['SOCIAL_MEDIA', 'YOUTUBE', 'MESSAGING', 'GAMING', 'NOTIFICATIONS', 'ENVIRONMENT', 'OTHER'].map(cat => (
              <Button
                key={cat}
                variant={distractionCategory === cat ? 'default' : 'outline'}
                onClick={() => setDistractionCategory(cat as DistractionCategory)}
                className="justify-start text-xs"
              >
                {cat.replace('_', ' ')}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDistractionDialog(false)}>Cancel</Button>
            <Button onClick={handleLogDistraction}>Log & Resume</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
