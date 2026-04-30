import { useEffect, useState } from 'react'
import { categoryService } from '@/services/category.service'
import { Card } from '@/components/ui/card'
import type { Category } from '@/types'
import { CategoryForm } from '@/components/categories/Category-form'
import { CategoryTable } from '@/components/categories/Category-table'

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const load = () => categoryService.list().then(setCategories)
  useEffect(() => {
    void load()
  }, [])

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>
      <CategoryForm
        name={name}
        onNameChange={setName}
        onAdd={async () => {
          await categoryService.create({ name })
          setName('')
          load()
        }}
      />
      <CategoryTable
        categories={categories}
        editing={editing}
        editName={editName}
        onEditNameChange={setEditName}
        onStartEdit={(category) => {
          setEditing(category.id)
          setEditName(category.name)
        }}
        onSaveEdit={async (category) => {
          await categoryService.update(category.id, { name: editName })
          setEditing(null)
          load()
        }}
        onDelete={async (category) => {
          if (!window.confirm('Delete category?')) return
          await categoryService.delete(category.id)
          load()
        }}
      />
    </Card>
  )
}
