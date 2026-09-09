import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[#2D2D2D] text-white hover:bg-[#404040] focus-visible:ring-[#B8A9C9]',
        primary: 'bg-[#B8A9C9] text-white hover:bg-[#A899B9] focus-visible:ring-[#B8A9C9]',
        destructive: 'bg-[#D4756A] text-white hover:bg-[#C4655A] focus-visible:ring-[#D4756A]',
        outline: 'border border-[#E8E4DF] bg-white text-[#2D2D2D] hover:bg-[#FBF8F3] focus-visible:ring-[#B8A9C9]',
        secondary: 'bg-[#FBF8F3] text-[#2D2D2D] hover:bg-[#F0EDE8] focus-visible:ring-[#B8A9C9]',
        ghost: 'text-[#6B6B6B] hover:bg-[#FBF8F3] hover:text-[#2D2D2D] focus-visible:ring-[#B8A9C9]',
        link: 'text-[#B8A9C9] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
