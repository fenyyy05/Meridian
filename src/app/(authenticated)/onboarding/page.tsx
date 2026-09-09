'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { createSubject } from '@/server/actions/subjects'
import { createTopic } from '@/server/actions/topics'
import { updateProfile } from '@/server/actions/profile'
import { Plus, X, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'

const SUBJECT_COLORS = [
  '#B8A9C9', // lavender
  '#E8C4C4', // pink
  '#A7C4D4', // blue
  '#B5C9B3', // sage
  '#F4E2B4', // yellow-ish
  '#D4756A'  // danger/red
]

type SubjectData = { tempId: string; name: string; color: string }
type TopicData = { subjectId: string; name: string; difficulty: number }

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  
  // State for step 1
  const [name, setName] = useState('')
  const [academicLevel, setAcademicLevel] = useState('')
  
  // State for step 2
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0])
  
  // State for step 3
  const [topics, setTopics] = useState<TopicData[]>([])
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicDifficulty, setNewTopicDifficulty] = useState([3])
  
  // State for step 4
  const [preferredStudyStart, setPreferredStudyStart] = useState('09:00')
  const [preferredStudyEnd, setPreferredStudyEnd] = useState('17:00')
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState('120')
  const [focusDuration, setFocusDuration] = useState('25')

  const totalSteps = 5

  const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps))
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1))

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return
    setSubjects([...subjects, { 
      tempId: Math.random().toString(36).substr(2, 9), 
      name: newSubjectName.trim(), 
      color: newSubjectColor 
    }])
    setNewSubjectName('')
    setNewSubjectColor(SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length])
  }

  const handleRemoveSubject = (tempId: string) => {
    setSubjects(subjects.filter(s => s.tempId !== tempId))
    setTopics(topics.filter(t => t.subjectId !== tempId))
  }

  const handleAddTopic = (subjectId: string) => {
    if (!newTopicName.trim()) return
    setTopics([...topics, {
      subjectId,
      name: newTopicName.trim(),
      difficulty: newTopicDifficulty[0]
    }])
    setNewTopicName('')
    setNewTopicDifficulty([3])
  }

  const handleRemoveTopic = (subjectId: string, topicName: string) => {
    setTopics(topics.filter(t => !(t.subjectId === subjectId && t.name === topicName)))
  }

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        // 1. Update Profile
        await updateProfile({
          name: name.trim() || undefined,
          academicLevel,
          preferredStudyStart,
          preferredStudyEnd,
          dailyGoalMinutes: parseInt(dailyGoalMinutes),
          focusDuration: parseInt(focusDuration),
          onboardingComplete: true
        })

        // 2. Create Subjects & Topics
        for (const subj of subjects) {
          const createdSubject = await createSubject({ name: subj.name, color: subj.color })
          if (createdSubject && createdSubject.subject) {
            const subjectTopics = topics.filter(t => t.subjectId === subj.tempId)
            for (const topic of subjectTopics) {
              await createTopic({ 
                subjectId: createdSubject.subject.id, 
                name: topic.name, 
                difficulty: topic.difficulty,
                confidenceLevel: 3
              })
            }
          }
        }

        router.push('/dashboard')
      } catch (error) {
        console.error('Failed to complete onboarding:', error)
        // Ideally show an error toast here
      }
    })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl border-[#E8E4DF] shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline" className="text-[#6B6B6B] border-[#E8E4DF]">
              Step {step} of {totalSteps}
            </Badge>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2 mb-6" />
          <CardTitle className="text-2xl text-[#2D2D2D]">
            {step === 1 && "Welcome to Meridian"}
            {step === 2 && "What are you studying?"}
            {step === 3 && "Break it down"}
            {step === 4 && "Set your preferences"}
            {step === 5 && "You're all set!"}
          </CardTitle>
          <CardDescription className="text-[#6B6B6B]">
            {step === 1 && "Let's personalize your learning experience."}
            {step === 2 && "Add the subjects or courses you're currently focusing on."}
            {step === 3 && "Add topics for each subject to help Meridian recommend what to study."}
            {step === 4 && "Tell us how you like to work so we can schedule effectively."}
            {step === 5 && "Review your setup before we generate your custom dashboard."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="min-h-[300px]">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label htmlFor="name">What should we call you?</Label>
                <Input 
                  id="name" 
                  placeholder="Your name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Current Academic Level</Label>
                <Select value={academicLevel} onValueChange={setAcademicLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="graduate">Graduate / PhD</SelectItem>
                    <SelectItem value="professional">Professional / Certification</SelectItem>
                    <SelectItem value="self_taught">Self-Taught</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* STEP 2: SUBJECTS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex gap-2 items-end">
                <div className="space-y-2 flex-1">
                  <Label>Add a Subject</Label>
                  <Input 
                    placeholder="e.g. Organic Chemistry, Calculus..." 
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-1 h-10 items-center">
                    {SUBJECT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewSubjectColor(color)}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${newSubjectColor === color ? 'scale-125 ring-2 ring-offset-1 ring-[#2D2D2D]' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <Button type="button" onClick={handleAddSubject} className="bg-[#2D2D2D] hover:bg-[#2D2D2D]/90">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#E8E4DF]">
                  {subjects.map(subj => (
                    <Badge 
                      key={subj.tempId} 
                      style={{ backgroundColor: subj.color, color: '#2D2D2D' }}
                      className="px-3 py-1 flex items-center gap-2 text-sm font-medium border-none"
                    >
                      {subj.name}
                      <button onClick={() => handleRemoveSubject(subj.tempId)} className="hover:bg-black/10 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#6B6B6B] bg-[#FBF8F3] rounded-lg border border-dashed border-[#E8E4DF]">
                  Add at least one subject to continue
                </div>
              )}
            </div>
          )}

          {/* STEP 3: TOPICS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {subjects.length === 0 ? (
                <p className="text-center text-[#6B6B6B]">You didn't add any subjects yet.</p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {subjects.map(subj => (
                    <AccordionItem key={subj.tempId} value={subj.tempId}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subj.color }} />
                          {subj.name}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="flex gap-2 items-end">
                          <div className="space-y-2 flex-1">
                            <Label>Topic Name</Label>
                            <Input 
                              placeholder="e.g. Nomenclature, Integrals..." 
                              value={newTopicName}
                              onChange={(e) => setNewTopicName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2 flex-1">
                            <Label>Difficulty (1-5)</Label>
                            <div className="h-10 flex items-center">
                              <Slider
                                value={newTopicDifficulty}
                                onValueChange={setNewTopicDifficulty}
                                max={5}
                                min={1}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            onClick={() => handleAddTopic(subj.tempId)} 
                            variant="secondary"
                          >
                            Add
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {topics.filter(t => t.subjectId === subj.tempId).map(topic => (
                            <Badge key={topic.name} variant="secondary" className="px-3 py-1 bg-[#FBF8F3]">
                              {topic.name} <span className="text-[#6B6B6B] ml-1 text-xs">(Lvl {topic.difficulty})</span>
                              <button onClick={() => handleRemoveTopic(subj.tempId, topic.name)} className="ml-2 hover:text-[#D4756A]">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          )}

          {/* STEP 4: PREFERENCES */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Start Time</Label>
                  <Select value={preferredStudyStart} onValueChange={setPreferredStudyStart}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}).map((_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {`${i.toString().padStart(2, '0')}:00`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred End Time</Label>
                  <Select value={preferredStudyEnd} onValueChange={setPreferredStudyEnd}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}).map((_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {`${i.toString().padStart(2, '0')}:00`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Daily Study Goal</Label>
                <Select value={dailyGoalMinutes} onValueChange={setDailyGoalMinutes}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="240">4+ hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Focus Session</Label>
                <Select value={focusDuration} onValueChange={setFocusDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min (Quick sprint)</SelectItem>
                    <SelectItem value="25">25 min (Standard Pomodoro)</SelectItem>
                    <SelectItem value="45">45 min (Deep work)</SelectItem>
                    <SelectItem value="50">50 min (Extended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETE */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#FBF8F3] p-6 rounded-lg border border-[#E8E4DF] space-y-4">
                <h3 className="font-semibold text-[#2D2D2D] flex items-center">
                  <Check className="w-5 h-5 mr-2 text-[#B5C9B3]" />
                  Profile Summary
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#6B6B6B] block">Name</span>
                    <span className="font-medium">{name || 'Student'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Level</span>
                    <span className="font-medium capitalize">{academicLevel.replace('_', ' ') || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Subjects</span>
                    <span className="font-medium">{subjects.length} added</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block">Daily Goal</span>
                    <span className="font-medium">{parseInt(dailyGoalMinutes) / 60} hrs</span>
                  </div>
                </div>

                {subjects.length > 0 && (
                  <div className="pt-4 border-t border-[#E8E4DF]">
                    <span className="text-[#6B6B6B] text-sm block mb-2">Your Subjects:</span>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map(s => (
                        <Badge key={s.tempId} style={{ backgroundColor: s.color, color: '#2D2D2D' }} className="border-none">
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-[#E8E4DF] pt-6">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={step === 1 || isPending}
            className="text-[#6B6B6B]"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {step < totalSteps ? (
            <div className="flex gap-2">
              {(step === 3 || step === 4) && (
                <Button variant="ghost" onClick={handleNext} className="text-[#6B6B6B]">
                  Skip
                </Button>
              )}
              <Button 
                onClick={handleNext} 
                disabled={step === 2 && subjects.length === 0}
                className="bg-[#2D2D2D] hover:bg-[#2D2D2D]/90"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isPending}
              className="bg-[#B8A9C9] hover:bg-[#B8A9C9]/90 text-[#2D2D2D]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Start Using Meridian'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
