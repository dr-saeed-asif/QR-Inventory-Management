import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InventoryFormProps {
  importFile: File | null
  importing: boolean
  search: string
  category: string
  location: string
  lowStockOnly: boolean
  expiredOnly: boolean
  onImportFileChange: (file: File | null) => void
  onImport: () => void
  onAddItem: () => void
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onLocationChange: (value: string) => void
  onLowStockOnlyChange: (checked: boolean) => void
  onExpiredOnlyChange: (checked: boolean) => void
}

export const InventoryForm = ({
  importing,
  search,
  category,
  location,
  lowStockOnly,
  expiredOnly,
  onImportFileChange,
  onImport,
  onAddItem,
  onSearchChange,
  onCategoryChange,
  onLocationChange,
  onLowStockOnlyChange,
  onExpiredOnlyChange,
}: InventoryFormProps) => (
  <>
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Inventories</h2>
      <div className="flex items-center gap-2">
        <Input
          type="file"
          className="h-10 w-auto"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => onImportFileChange(event.target.files?.[0] ?? null)}
        />
        <Button type="button" variant="outline" disabled={importing} onClick={onImport}>
          {importing ? 'Importing...' : 'Import CSV/Excel'}
        </Button>
        <Button onClick={onAddItem}>+ Add Item</Button>
      </div>
    </div>

    <div className="grid gap-2 md:grid-cols-5">
      <Input placeholder="Search inventory..." value={search} onChange={(e) => onSearchChange(e.target.value)} />
      <Input placeholder="Filter category" value={category} onChange={(e) => onCategoryChange(e.target.value)} />
      <Input placeholder="Filter location" value={location} onChange={(e) => onLocationChange(e.target.value)} />
      <label className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm">
        <input type="checkbox" checked={lowStockOnly} onChange={(e) => onLowStockOnlyChange(e.target.checked)} />
        Low stock only
      </label>
      <label className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm">
        <input type="checkbox" checked={expiredOnly} onChange={(e) => onExpiredOnlyChange(e.target.checked)} />
        Expired only
      </label>
    </div>
  </>
)
