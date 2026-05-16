import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Party, PartyType } from '@/types'

interface PartyTableProps {
  parties: Party[]
  canManage: boolean
  editing: string | null
  editDraft: { name: string; phone: string; email: string; address: string; type: PartyType }
  onEditDraftChange: (draft: PartyTableProps['editDraft']) => void
  onStartEdit: (party: Party) => void
  onSaveEdit: (party: Party) => void
  onCancelEdit: () => void
  onDelete: (party: Party) => void
}

const typeLabel: Record<PartyType, string> = {
  CUSTOMER: 'Customer',
  SUPPLIER: 'Supplier',
  BOTH: 'Customer & Supplier',
}

export const PartyTable = ({
  parties,
  canManage,
  editing,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: PartyTableProps) => (
  <div className="space-y-2">
    {parties.map((party) => (
      <div key={party.id} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
        {editing === party.id ? (
          <div className="grid flex-1 gap-2 md:grid-cols-2">
            <Input
              value={editDraft.name}
              onChange={(e) => onEditDraftChange({ ...editDraft, name: e.target.value })}
              placeholder="Name"
            />
            <Input
              value={editDraft.phone}
              onChange={(e) => onEditDraftChange({ ...editDraft, phone: e.target.value })}
              placeholder="Phone"
            />
            <Input
              value={editDraft.email}
              onChange={(e) => onEditDraftChange({ ...editDraft, email: e.target.value })}
              placeholder="Email"
            />
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={editDraft.type}
              onChange={(e) => onEditDraftChange({ ...editDraft, type: e.target.value as PartyType })}
            >
              <option value="BOTH">Customer & Supplier</option>
              <option value="CUSTOMER">Customer</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </div>
        ) : (
          <div>
            <p className="font-medium">{party.name}</p>
            <p className="text-xs text-slate-500">
              {typeLabel[party.type]}
              {party.phone ? ` · ${party.phone}` : ''}
              {party.email ? ` · ${party.email}` : ''}
            </p>
            <p className="text-xs text-slate-400">
              {party.salesCount ?? 0} sales · {party.purchasesCount ?? 0} purchases
            </p>
          </div>
        )}
        {canManage ? (
          <div className="flex gap-2">
            {editing === party.id ? (
              <>
                <Button variant="outline" onClick={() => onSaveEdit(party)}>
                  Save
                </Button>
                <Button variant="outline" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onStartEdit(party)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => onDelete(party)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>
    ))}
  </div>
)
