import { useCallback, useState, useRef } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import { Modal } from '../../../shared/ui/Modal'
import type { CalculatorState, CalculatorTarget } from '../model/types'

interface ImportResult {
  state: CalculatorState
  tagItemSelections: Record<string, string>
  tagFluidSelections: Record<string, string>
}

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (result: ImportResult) => void
}

function parseImportJson(text: string): ImportResult | null {
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('expected a JSON object')
    }

    if (!Array.isArray(parsed.targets) || parsed.targets.length === 0) {
      throw new Error('missing or empty "targets" array')
    }

    const targets: CalculatorTarget[] = []
    for (const t of parsed.targets) {
      if (!t || typeof t !== 'object') continue
      if (typeof t.itemId !== 'string' || !t.itemId.includes(':')) continue
      if (typeof t.amount !== 'number' || t.amount <= 0) continue
      targets.push({ itemId: t.itemId, amount: Math.max(1, Math.floor(t.amount) || 1) })
    }

    if (targets.length === 0) {
      throw new Error('no valid targets found (need itemId and amount > 0)')
    }

    const selections: Record<string, string> = {}
    if (parsed.selections && typeof parsed.selections === 'object') {
      for (const [k, v] of Object.entries(parsed.selections)) {
        if (typeof v === 'string' && v.length > 0) selections[k] = v
      }
    }

    const tagItemSelections: Record<string, string> = {}
    if (parsed.tagItemSelections && typeof parsed.tagItemSelections === 'object') {
      for (const [k, v] of Object.entries(parsed.tagItemSelections)) {
        if (typeof v === 'string') tagItemSelections[k] = v
      }
    }

    const tagFluidSelections: Record<string, string> = {}
    if (parsed.tagFluidSelections && typeof parsed.tagFluidSelections === 'object') {
      for (const [k, v] of Object.entries(parsed.tagFluidSelections)) {
        if (typeof v === 'string') tagFluidSelections[k] = v
      }
    }

    return { state: { targets, selections }, tagItemSelections, tagFluidSelections }
  } catch (e) {
    console.warn('[ImportModal] parse error:', e instanceof Error ? e.message : e)
    return null
  }
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const { t } = useI18n()
  const [importText, setImportText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const dropCounter = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropCounter.current++
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropCounter.current--
    if (dropCounter.current <= 0) {
      dropCounter.current = 0
      setDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropCounter.current = 0
    setDragOver(false)
    setError(null)

    const file = e.dataTransfer.files[0]
    if (!file) return

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError(t('importInvalid'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImportText(String(reader.result ?? ''))
    }
    reader.readAsText(file)
  }, [t])

  const handleImport = useCallback(() => {
    setError(null)
    const trimmed = importText.trim()
    if (!trimmed) {
      setError(t('importEmpty'))
      return
    }

    const result = parseImportJson(trimmed)
    if (!result) {
      setError(t('importInvalid'))
      return
    }

    onImport(result)
    setImportText('')
    onClose()
  }, [importText, onImport, onClose, t])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('import')}>
      <div
        className={`import-drop-zone${dragOver ? ' import-drag-over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <textarea
          className="import-textarea"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={t('importPlaceholder')}
          rows={10}
        />
        {error && <div className="import-error">{error}</div>}
        <button type="button" className="import-submit-btn" onClick={handleImport}>
          {t('import')}
        </button>
      </div>
    </Modal>
  )
}
