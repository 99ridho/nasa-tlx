import { Button } from '#/components/ui/button'

interface CSVExportButtonProps {
  studyId: string
}

export function CSVExportButton({ studyId }: CSVExportButtonProps) {
  async function handleExport() {
    // Trigger CSV download via fetch
    const response = await fetch(`/api/studies/${studyId}/export`)
    if (response.ok) {
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `study-${studyId}-export.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Button onClick={handleExport} variant="outline" className="min-h-[44px]">
      Export CSV
    </Button>
  )
}
