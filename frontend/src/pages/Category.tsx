import { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { categoryService } from '@/services/category.service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageListHeader } from '@/components/layout/page-list-header'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import type { Category } from '@/types'
import { CategoryForm } from '@/components/categories/Category-form'
import { CategoryTable } from '@/components/categories/Category-table'
import { categoriesI18n } from '@/components/categories/i18n'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'
import { hasPermission } from '@/lib/permissions'
import { ListPagination } from '@/components/ui/list-pagination'

const PAGE_SIZE = 10

export const CategoriesPage = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const canManage = hasPermission(user?.role, 'categories.manage', user?.permissions)
  const locale = useUiStore((state) => state.locale)
  const isCreateRoute = location.pathname.endsWith('/create')
  const t = categoriesI18n[locale]

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const load = async (pageNum = page) => {
    setLoading(true)
    try {
      const res = await categoryService.list({ page: pageNum, pageSize: PAGE_SIZE })
      setCategories(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isCreateRoute) void load(page)
  }, [isCreateRoute, page])

  const closeForm = () => navigate('/admin/categories')

  if (isCreateRoute) {
    if (!canManage) {
      return <EmptyState title="Access denied" subtitle="You do not have permission to manage categories." />
    }
    return (
      <div className="space-y-4">
        <PageListHeader title={t.title} subtitle="Add a new category." showAdd={false} />
        <Button variant="outline" onClick={closeForm}>
          Back to Categories
        </Button>
        <Card className="space-y-4 p-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Category name</label>
            <CategoryForm
              name={name}
              canManage
              placeholder={t.categoryNamePlaceholder}
              addLabel={t.add}
              onNameChange={setName}
              onAdd={async () => {
                if (name.trim().length < 2) {
                  toast({ title: 'Category name is required', variant: 'error' })
                  return
                }
                try {
                  await categoryService.create({ name })
                  setName('')
                  toast({ title: 'Category added' })
                  setPage(1)
                  closeForm()
                } catch (error) {
                  const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined
                  toast({ title: 'Failed to add category', description: message, variant: 'error' })
                }
              }}
            />
          </div>
          <Button variant="outline" onClick={closeForm}>
            Cancel
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <ListPageLayout
      loading={loading}
      isEmpty={!loading && total === 0}
      emptySubtitle="No categories found. Click Add to create one."
      header={
        <PageListHeader
          title={t.title}
          subtitle="Organize inventory items by category."
          addLabel="Add"
          showAdd={canManage}
          onAdd={() => navigate('/admin/categories/create')}
        />
      }
      pagination={<ListPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
    >
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
          await load(page)
        }}
        onDelete={async (category) => {
          if (!window.confirm(t.deleteConfirm)) return
          try {
            await categoryService.delete(category.id)
            if (categories.length === 1 && page > 1) setPage(page - 1)
            else await load(page)
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
    </ListPageLayout>
  )
}
