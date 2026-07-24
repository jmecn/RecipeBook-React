import { useCallback, useState } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import { Modal } from '../../../shared/ui/Modal'
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
      try {
        const url = new URL(trimmed)
        const calc = url.searchParams.get('calc')
        if (calc) {
          state = decodeCalcState(calc)
        }
      } catch {
        setError(t('importExportInvalid'))
        return
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('importExportImport')}>
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
    </Modal>
  )
}
