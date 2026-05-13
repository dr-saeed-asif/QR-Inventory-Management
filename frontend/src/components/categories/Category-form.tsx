import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CategoryFormProps {
  name: string
  canManage: boolean
  placeholder: string
  addLabel: string
  onNameChange: (value: string) => void
  onAdd: () => void
}

export const CategoryForm = ({ name, canManage, placeholder, addLabel, onNameChange, onAdd }: CategoryFormProps) => (
  <div className="flex gap-2">
    <Input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder={placeholder} />
    {canManage ? <Button onClick={onAdd}>{addLabel}</Button> : null}
  </div>
)
