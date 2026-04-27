import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

export const Card = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
    {children}
  </div>
)
