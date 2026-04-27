import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-slate-300 focus:ring-2',
      className,
    )}
    {...props}
  />
)
