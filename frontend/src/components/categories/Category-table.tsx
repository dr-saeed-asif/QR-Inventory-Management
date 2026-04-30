import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Category } from '@/types'

interface CategoryTableProps {
  categories: Category[]
  editing: string | null
  editName: string
  onEditNameChange: (value: string) => void
  onStartEdit: (category: Category) => void
  onSaveEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export const CategoryTable = ({
  categories,
  editing,
  editName,
  onEditNameChange,
  onStartEdit,
  onSaveEdit,
  onDelete,
}: CategoryTableProps) => (
  <div className="space-y-2">
    {categories.map((category) => (
      <div key={category.id} className="flex items-center justify-between rounded-md border p-2">
        <div>
          {editing === category.id ? (
            <Input value={editName} onChange={(event) => onEditNameChange(event.target.value)} />
          ) : (
            <p className="font-medium">{category.name}</p>
          )}
          <p className="text-xs text-slate-500">{category.itemsCount} items</p>
        </div>
        <div className="space-x-2">
          {editing === category.id ? (
            <Button variant="outline" onClick={() => onSaveEdit(category)}>
              Save
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onStartEdit(category)}>
              Edit
            </Button>
          )}
          <Button variant="destructive" onClick={() => onDelete(category)}>
            Delete
          </Button>
        </div>
      </div>
    ))}
  </div>
)
