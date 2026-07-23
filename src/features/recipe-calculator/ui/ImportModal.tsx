import { useCallback, useState } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import { decodeCalcState } from '../../../shared/lib/calc-base64'
import type { CalculatorState } from '../model/types'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (state: CalculatorState) => void
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const { t } = useI18n()
  const [importText, setImportText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleImport = useCallback(() => {
    setError(null)
    const trimmed = importText.trim()
    if (!trimmed) {
      setError(t('importExportEmpty'))
      return
    }

    let state: CalculatorState | null = null

    if (trimmed.includes('?calc=')) {
      const url = new URL(trimmed)
      const calc = url.searchParams.get('calc')
      if (calc) {
        state = decodeCalcState(calc)
      }
    } else {
      state = decodeCalcState(trimmed)
    }

    if (!state) {
      setError(t('importExportInvalid'))
      return
    }

    onImport(state)
    setImportText('')
    onClose()
  }, [importText, onImport, onClose, t])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content calc-select-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('importExportImport')}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <textarea
            className="import-textarea"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t('importExportPlaceholder')}
            rows={10}
          />
          {error && <div className="import-error">{error}</div>}
          <button type="button" className="import-submit-btn" onClick={handleImport}>
            {t('importExportImportButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
