import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'outline' | 'destructive' | 'contained'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export const Button = ({ className, variant = 'default', ...props }: Props) => (
  <button
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md px-4 mt-2 m-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'default' && 'bg-slate-900 text-white hover:bg-slate-700',
      variant === 'outline' && 'border border-slate-200 bg-white hover:bg-slate-100',
      variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-500',
      variant === 'contained' && 'bg-blue-600 text-white hover:bg-blue-500',
      className,
    )}
    {...props}
  />
)
