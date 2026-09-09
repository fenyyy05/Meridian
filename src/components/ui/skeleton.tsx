import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[#E8E4DF]/50', className)}
      {...props}
    />
  )
}

export { Skeleton }
