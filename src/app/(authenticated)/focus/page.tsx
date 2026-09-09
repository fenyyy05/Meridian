import { FocusTimer } from '@/components/focus/FocusTimer'

export const metadata = {
  title: 'Focus | Meridian',
  description: 'Focus mode with pomodoro timer',
}

export default function FocusPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#2D2D2D]">Focus Mode</h1>
        <p className="text-[#6B6B6B] mt-2">Deep work and timed sessions</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-[#E8E4DF] p-6 lg:p-10">
        <FocusTimer />
      </div>
    </div>
  )
}
