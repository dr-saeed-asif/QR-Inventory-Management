import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CategoryFormProps {
  name: string
  onNameChange: (value: string) => void
  onAdd: () => void
}

export const CategoryForm = ({ name, onNameChange, onAdd }: CategoryFormProps) => (
  <div className="flex gap-2">
    <Input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Category name" />
    <Button onClick={onAdd}>Add</Button>
  </div>
)
