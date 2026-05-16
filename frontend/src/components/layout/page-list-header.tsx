import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageListHeaderProps {
  title: string
  subtitle: string
  addLabel?: string
  showAdd?: boolean
  onAdd?: () => void
}

export const PageListHeader = ({ title, subtitle, addLabel = 'Add', showAdd = false, onAdd }: PageListHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
    {showAdd && onAdd ? (
      <Button className="shrink-0 self-start shadow-lg shadow-sky-500/15" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    ) : null}
  </div>
)
