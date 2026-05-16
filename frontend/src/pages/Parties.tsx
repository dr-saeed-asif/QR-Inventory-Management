import { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { partyService } from '@/services/party.service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageListHeader } from '@/components/layout/page-list-header'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import type { Party, PartyType } from '@/types'
import { PartyForm } from '@/components/parties/Party-form'
import { PartyTable } from '@/components/parties/Party-table'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth-store'
import { hasPermission } from '@/lib/permissions'
import { ListPagination } from '@/components/ui/list-pagination'

const PAGE_SIZE = 10

const emptyDraft = () => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  type: 'BOTH' as PartyType,
})

export const PartiesPage = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const canManage = hasPermission(user?.role, 'parties.manage', user?.permissions)
  const isCreateRoute = location.pathname.endsWith('/create')

  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [type, setType] = useState<PartyType>('BOTH')
  const [editing, setEditing] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState(emptyDraft())

  const load = async (pageNum = page) => {
    setLoading(true)
    try {
      const res = await partyService.list({ page: pageNum, pageSize: PAGE_SIZE })
      setParties(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isCreateRoute) void load(page)
  }, [isCreateRoute, page])

  const resetForm = () => {
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setType('BOTH')
  }

  const closeForm = () => navigate('/admin/parties')

  if (isCreateRoute) {
    if (!canManage) {
      return <EmptyState title="Access denied" subtitle="You do not have permission to add parties." />
    }
    return (
      <div className="space-y-4">
        <PageListHeader title="Add party" subtitle="Create a customer or supplier." showAdd={false} />
        <Button variant="outline" onClick={closeForm}>
          Back to Parties
        </Button>
        <Card>
          <PartyForm
            name={name}
            phone={phone}
            email={email}
            address={address}
            type={type}
            canManage
            submitLabel="Save party"
            onNameChange={setName}
            onPhoneChange={setPhone}
            onEmailChange={setEmail}
            onAddressChange={setAddress}
            onTypeChange={setType}
            onCancel={closeForm}
            onSubmit={async () => {
              if (name.trim().length < 2) {
                toast({ title: 'Name is required', variant: 'error' })
                return
              }
              try {
                await partyService.create({ name, phone, email, address, type })
                resetForm()
                toast({ title: 'Party added' })
                setPage(1)
                closeForm()
              } catch (error) {
                const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined
                toast({ title: 'Failed to add party', description: message, variant: 'error' })
              }
            }}
          />
        </Card>
      </div>
    )
  }

  return (
    <ListPageLayout
      loading={loading}
      isEmpty={!loading && total === 0}
      emptySubtitle="No parties found. Click Add to create one."
      header={
        <PageListHeader
          title="Parties"
          subtitle="Customers and suppliers for sales and purchases."
          addLabel="Add"
          showAdd={canManage}
          onAdd={() => navigate('/admin/parties/create')}
        />
      }
      pagination={<ListPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
    >
      <PartyTable
        parties={parties}
        canManage={canManage}
        editing={editing}
        editDraft={editDraft}
        onEditDraftChange={setEditDraft}
        onStartEdit={(party) => {
          setEditing(party.id)
          setEditDraft({
            name: party.name,
            phone: party.phone ?? '',
            email: party.email ?? '',
            address: party.address ?? '',
            type: party.type,
          })
        }}
        onSaveEdit={async (party) => {
          try {
            await partyService.update(party.id, editDraft)
            setEditing(null)
            await load(page)
            toast({ title: 'Party updated' })
          } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined
            toast({ title: 'Update failed', description: message, variant: 'error' })
          }
        }}
        onCancelEdit={() => setEditing(null)}
        onDelete={async (party) => {
          if (!window.confirm(`Delete "${party.name}"?`)) return
          try {
            await partyService.delete(party.id)
            if (parties.length === 1 && page > 1) setPage(page - 1)
            else await load(page)
            toast({ title: 'Party deleted' })
          } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined
            toast({ title: 'Delete failed', description: message, variant: 'error' })
          }
        }}
      />
    </ListPageLayout>
  )
}
