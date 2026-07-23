import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client'
import type { CalculatorTarget } from '../model/types'

interface TargetItemProps {
  target: CalculatorTarget
  index: number
  baseUrl: string
  locale: string
  onRemove: (index: number) => void
  onAmountChange: (index: number, amount: number) => void
}

function TargetItem({ target, index, baseUrl, locale, onRemove, onAmountChange }: TargetItemProps) {
  const { t } = useI18n()
  const iconRef = useRef<HTMLSpanElement | null>(null)
  const client = useMemo(() => getEmiRendererClient(), [])
  const [editingAmount, setEditingAmount] = useState(false)
  const [draftAmount, setDraftAmount] = useState(String(target.amount))

  useEffect(() => {
    const host = iconRef.current
    if (!host) return
    const session = client.mountItemIcon(host, { itemId: target.itemId, baseUrl, locale })
    return () => session.disconnect()
  }, [baseUrl, client, target.itemId, locale])

  useEffect(() => {
    setDraftAmount(String(target.amount))
  }, [target.amount])

  const commitAmount = () => {
    const num = parseInt(draftAmount, 10)
    if (!isNaN(num) && num > 0) {
      onAmountChange(index, num)
    } else {
      setDraftAmount(String(target.amount))
    }
    setEditingAmount(false)
  }

  return (
    <div className="target-item">
      <span className="target-item-icon" ref={iconRef} />
      <span className="target-item-id">{target.itemId}</span>
      <input
        className="target-amount-input"
        type="number"
        min="1"
        value={editingAmount ? draftAmount : target.amount}
        onFocus={() => {
          setEditingAmount(true)
          setDraftAmount(String(target.amount))
        }}
        onBlur={commitAmount}
        onChange={(e) => setDraftAmount(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitAmount()
          if (e.key === 'Escape') {
            setDraftAmount(String(target.amount))
            setEditingAmount(false)
          }
        }}
      />
      <button
        type="button"
        className="target-remove-btn"
        onClick={() => onRemove(index)}
        title={t('calcRemoveTarget')}
      >
        ×
      </button>
    </div>
  )
}

interface TargetListProps {
  targets: CalculatorTarget[]
  baseUrl: string
  locale: string
  onRemove: (index: number) => void
  onAmountChange: (index: number, amount: number) => void
}

export function TargetList({ targets, baseUrl, locale, onRemove, onAmountChange }: TargetListProps) {
  const { t } = useI18n()

  if (targets.length === 0) {
    return (
      <div className="target-list-empty">
        {t('calcNoTargets')}
      </div>
    )
  }

  return (
    <div className="target-list">
      {targets.map((target, index) => (
        <TargetItem
          key={`${target.itemId}-${index}`}
          target={target}
          index={index}
          baseUrl={baseUrl}
          locale={locale}
          onRemove={onRemove}
          onAmountChange={onAmountChange}
        />
      ))}
    </div>
  )
}
