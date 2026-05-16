import { Button } from '@/components/ui/button'

interface ListPaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export const ListPagination = ({ page, pageSize, total, onPageChange }: ListPaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm text-slate-600">
      <p>
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <span>
          Page {page} / {totalPages}
        </span>
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

