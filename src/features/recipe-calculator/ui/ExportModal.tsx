import { useCallback, useRef } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import { Modal } from '../../../shared/ui/Modal'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  exportJson: string
}

export function ExportModal({ isOpen, onClose, exportJson }: ExportModalProps) {
  const { t } = useI18n()
  const textRef = useRef<HTMLTextAreaElement>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportJson)
    } catch {
      textRef.current?.select()
      document.execCommand('copy')
    }
  }, [exportJson])

  const handleDownload = useCallback(() => {
    const blob = new Blob([exportJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'save.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [exportJson])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('export')}>
      <textarea
        ref={textRef}
        className="export-textarea"
        readOnly
        value={exportJson}
        rows={10}
      />
      <div className="export-buttons">
        <button type="button" className="export-copy-btn" onClick={handleCopy}>
          {t('copy')}
        </button>
        <button type="button" className="export-download-btn" onClick={handleDownload}>
          {t('download')}
        </button>
      </div>
    </Modal>
  )
}
