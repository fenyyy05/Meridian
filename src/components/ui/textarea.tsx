import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-sm text-[#2D2D2D] placeholder:text-[#9B9B9B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8A9C9] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
