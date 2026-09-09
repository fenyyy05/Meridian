import { getTasks } from '@/server/actions/tasks'
import { getSubjects } from '@/server/actions/subjects'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { TaskCard } from '@/components/tasks/TaskCard'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Tasks | Meridian',
  description: 'Manage your tasks and workload',
}

export default async function TasksPage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const status = searchParams.status || 'ALL'
  const subjectId = searchParams.subjectId
  const sortBy = searchParams.sortBy as any
  const search = searchParams.search

  const tasks = await getTasks({ status, subjectId, sortBy, search })
  const subjects = await getSubjects()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Tasks</h1>
          <p className="text-[#6B6B6B] mt-1">Manage your workload</p>
        </div>
        <CreateTaskDialog subjects={subjects}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </CreateTaskDialog>
      </div>

      <TaskFilters subjects={subjects} />

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E8E4DF]">
          <p className="text-[#6B6B6B]">No tasks yet. Create your first task to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} subjects={subjects} />
          ))}
        </div>
      )}
    </div>
  )
}
