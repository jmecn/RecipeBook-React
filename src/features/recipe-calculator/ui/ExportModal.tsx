import { useCallback, useMemo, useRef } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import { encodeCalcState } from '../../../shared/lib/calc-base64'
import type { CalculatorState } from '../model/types'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  currentState: CalculatorState
}

export function ExportModal({ isOpen, onClose, currentState }: ExportModalProps) {
  const { t } = useI18n()
  const textRef = useRef<HTMLTextAreaElement>(null)

  const exportUrl = useMemo(() => {
    if (!isOpen) return ''
    const encoded = encodeCalcState(currentState)
    return `${window.location.origin}${window.location.pathname}?calc=${encoded}`
  }, [currentState, isOpen])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportUrl)
    } catch {
      textRef.current?.select()
      document.execCommand('copy')
    }
  }, [exportUrl])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content calc-select-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('importExportExport')}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <textarea
            ref={textRef}
            className="export-textarea"
            readOnly
            value={exportUrl}
            rows={10}
          />
          <button type="button" className="export-copy-btn" onClick={handleCopy}>
            {t('importExportCopy')}
          </button>
        </div>
      </div>
    </div>
  )
}
