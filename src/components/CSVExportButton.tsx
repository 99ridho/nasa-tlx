import { Button } from '#/components/ui/button'
import { getStudySessionsExport, generateCSV } from '#/server/export'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CSVExportButtonProps {
  studyId: string
}

export function CSVExportButton({ studyId }: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { t } = useTranslation()

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
      {isExporting ? t('study.exporting') : t('study.export')}
    </Button>
  )
}
