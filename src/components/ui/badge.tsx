import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#2D2D2D] text-white',
        secondary: 'border-transparent bg-[#FBF8F3] text-[#6B6B6B]',
        destructive: 'border-transparent bg-[#D4756A] text-white',
        outline: 'border-[#E8E4DF] text-[#6B6B6B]',
        lavender: 'border-transparent bg-[#B8A9C9]/15 text-[#8B7BA8]',
        blue: 'border-transparent bg-[#A7C4D4]/15 text-[#6B96A8]',
        sage: 'border-transparent bg-[#B5C9B3]/15 text-[#7A9B77]',
        pink: 'border-transparent bg-[#E8C4C4]/15 text-[#B88A8A]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
