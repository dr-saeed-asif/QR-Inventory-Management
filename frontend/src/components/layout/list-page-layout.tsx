import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

interface ListPageLayoutProps {
  header: ReactNode
  loading?: boolean
  isEmpty?: boolean
  emptyTitle?: string
  emptySubtitle?: string
  pagination?: ReactNode
  children: ReactNode
  className?: string
}

export const ListPageLayout = ({
  header,
  loading = false,
  isEmpty = false,
  emptyTitle = 'Record not available',
  emptySubtitle = 'No records found. Click Add to create one.',
  pagination,
  children,
  className,
}: ListPageLayoutProps) => (
  <Card className={cn('flex max-h-[calc(100vh-8rem)] min-h-[24rem] flex-col gap-4', className)}>
    <div className="shrink-0">{header}</div>
    {loading ? (
      <p className="shrink-0 text-sm text-slate-500">Loading...</p>
    ) : isEmpty ? (
      <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
    ) : (
      <>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">{children}</div>
        {pagination ? <div className="shrink-0">{pagination}</div> : null}
      </>
    )}
  </Card>
)
