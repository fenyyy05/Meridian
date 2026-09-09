'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { updateProfile } from '@/server/actions/profile'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    academicLevel: '',
    dailyGoalMinutes: 120,
    focusDuration: 25,
    preferredStudyStart: '',
    preferredStudyEnd: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const { getProfile } = await import('@/server/actions/profile')
        const profile = await getProfile()
        if (profile) {
          setFormData({
            name: '', // We don't get the name from the profile directly, normally we'd fetch the user too
            academicLevel: profile.academicLevel || '',
            dailyGoalMinutes: profile.dailyGoalMinutes || 120,
            focusDuration: profile.focusDuration || 25,
            preferredStudyStart: profile.preferredStudyStart || '',
            preferredStudyEnd: profile.preferredStudyEnd || '',
          })
        }
      } catch (error) {
        console.error('Failed to load profile', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(formData)
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#B8A9C9]" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2">Settings</h1>
        <p className="text-[#6B6B6B]">Manage your account settings and study preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Preferences</CardTitle>
          <CardDescription>Adjust how Meridian plans your study sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="academicLevel">Academic Level</Label>
            <Select 
              value={formData.academicLevel} 
              onValueChange={(v) => handleChange('academicLevel', v)}
            >
              <SelectTrigger id="academicLevel">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH_SCHOOL">High School</SelectItem>
                <SelectItem value="UNDERGRADUATE">Undergraduate</SelectItem>
                <SelectItem value="GRADUATE">Graduate</SelectItem>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dailyGoal">Daily Study Goal (minutes)</Label>
              <Select 
                value={formData.dailyGoalMinutes.toString()} 
                onValueChange={(v) => handleChange('dailyGoalMinutes', parseInt(v))}
              >
                <SelectTrigger id="dailyGoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="focusDuration">Default Focus Duration</Label>
              <Select 
                value={formData.focusDuration.toString()} 
                onValueChange={(v) => handleChange('focusDuration', parseInt(v))}
              >
                <SelectTrigger id="focusDuration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="25">25 minutes (Standard)</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="50">50 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredStart">Preferred Start Time</Label>
              <Input 
                id="preferredStart" 
                type="time" 
                value={formData.preferredStudyStart}
                onChange={(e) => handleChange('preferredStudyStart', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredEnd">Preferred End Time</Label>
              <Input 
                id="preferredEnd" 
                type="time" 
                value={formData.preferredStudyEnd}
                onChange={(e) => handleChange('preferredStudyEnd', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-[#FBF8F3] border-t border-[#E8E4DF] px-6 py-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-[#B8A9C9] hover:bg-[#A899B9] text-white">
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-[#D4756A]">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#2D2D2D]">Delete Account</p>
              <p className="text-sm text-[#6B6B6B]">Permanently delete your account and all data.</p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
