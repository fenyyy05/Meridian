'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function TaskFilters({ subjects }: { subjects: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'ALL') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    startTransition(() => {
      router.push(`/tasks?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange('search', search)
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E8E4DF] flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px]">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <Input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
          />
        </form>
      </div>
      
      <Select 
        value={searchParams.get('status') || 'ALL'} 
        onValueChange={(v) => handleFilterChange('status', v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="TODO">To Do</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="POSTPONED">Postponed</SelectItem>
        </SelectContent>
      </Select>
      
      <Select 
        value={searchParams.get('subjectId') || 'ALL'} 
        onValueChange={(v) => handleFilterChange('subjectId', v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Subject" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Subjects</SelectItem>
          {subjects.map(s => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select 
        value={searchParams.get('sortBy') || 'priority'} 
        onValueChange={(v) => handleFilterChange('sortBy', v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="deadline">Deadline</SelectItem>
          <SelectItem value="difficulty">Difficulty</SelectItem>
          <SelectItem value="createdAt">Recent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
