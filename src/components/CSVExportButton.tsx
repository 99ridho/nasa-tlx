import { Button } from '#/components/ui/button'
import { getStudySessionsExport, generateCSV } from '#/server/export'
import { useState } from 'react'

interface CSVExportButtonProps {
  studyId: string
}

export function CSVExportButton({ studyId }: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const rows = await getStudySessionsExport({ data: { studyId } })
      const csv = generateCSV(rows)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `study-${studyId}-export.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} variant="outline" className="min-h-11" disabled={isExporting}>
      {isExporting ? 'Exporting…' : 'Export CSV'}
    </Button>
  )
}
