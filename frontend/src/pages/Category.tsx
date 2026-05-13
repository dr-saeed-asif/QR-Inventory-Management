import { useEffect, useState } from 'react'
import axios from 'axios'
import { categoryService } from '@/services/category.service'
import { Card } from '@/components/ui/card'
import type { Category } from '@/types'
import { CategoryForm } from '@/components/categories/Category-form'
import { CategoryTable } from '@/components/categories/Category-table'
import { categoriesI18n } from '@/components/categories/i18n'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'
import { hasPermission } from '@/lib/permissions'

export const CategoriesPage = () => {
  const { toast } = useToast()
  const user = useAuthStore((state) => state.user)
  const canManage = hasPermission(user?.role, 'categories.manage', user?.permissions)
  const locale = useUiStore((state) => state.locale)
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const t = categoriesI18n[locale]

  const load = () => categoryService.list().then(setCategories)
  useEffect(() => {
    void load()
  }, [])

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">{t.title}</h2>
      <CategoryForm
        name={name}
        canManage={canManage}
        placeholder={t.categoryNamePlaceholder}
        addLabel={t.add}
        onNameChange={setName}
        onAdd={async () => {
          await categoryService.create({ name })
          setName('')
          load()
        }}
      />
      <CategoryTable
        categories={categories}
        canManage={canManage}
        editing={editing}
        editName={editName}
        saveLabel={t.save}
        editLabel={t.edit}
        deleteLabel={t.delete}
        itemsLabel={t.items}
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
          if (!window.confirm(t.deleteConfirm)) return
          try {
            await categoryService.delete(category.id)
            await load()
            toast({ title: 'Category deleted successfully' })
          } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined
            toast({
              title: 'Delete failed',
              description: message || (error instanceof Error ? error.message : 'Please try again.'),
              variant: 'error',
            })
          }
        }}
      />
    </Card>
  )
}
