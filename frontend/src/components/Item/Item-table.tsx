import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ItemTableProps {
  qrImage: string
  barcodeImage: string
  onDownload: (imageUrl: string, filename: string) => void
}

export const ItemTable = ({ qrImage, barcodeImage, onDownload }: ItemTableProps) => {
  if (!qrImage && !barcodeImage) return null
  return (
    <Card className="space-y-2">
      <p className="font-medium">Generated Codes</p>
      <div className="grid gap-4 md:grid-cols-2">
        {qrImage ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">QR Code</p>
            <img src={qrImage} alt="Generated QR code" className="h-40 w-40" />
            <Button type="button" variant="outline" onClick={() => onDownload(qrImage, `qr-code-${Date.now()}.png`)}>Download QR</Button>
          </div>
        ) : null}
        {barcodeImage ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Barcode (CODE128)</p>
            <img src={barcodeImage} alt="Generated barcode" className="h-28 w-full max-w-xs object-contain" />
            <Button type="button" variant="outline" onClick={() => onDownload(barcodeImage, `barcode-${Date.now()}.png`)}>Download Barcode</Button>
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => window.print()}>Print Codes</Button>
      </div>
    </Card>
  )
}

