import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client'
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel'

interface FavoriteItemRowProps {
  itemId: string
  label?: string
  isSelected: boolean
  amount: number
  baseUrl: string
  locale: string
  onToggleSelect: (itemId: string) => void
  onRemove: (itemId: string) => void
  onAmountChange: (itemId: string, amount: number) => void
}

export function FavoriteItemRow({
  itemId,
  label,
  isSelected,
  amount,
  baseUrl,
  locale,
  onToggleSelect,
  onRemove,
  onAmountChange,
}: FavoriteItemRowProps) {
  const { t } = useI18n()
  const iconRef = useRef<HTMLSpanElement | null>(null)
  const client = useMemo(() => getEmiRendererClient(), [])
  const [editingAmount, setEditingAmount] = useState(false)
  const [draftAmount, setDraftAmount] = useState(String(amount))

  useEffect(() => {
    const host = iconRef.current
    if (!host) return
    const session = client.mountItemIcon(host, { itemId, baseUrl, locale })
    return () => session.disconnect()
  }, [baseUrl, client, itemId, locale])

  useEffect(() => {
    setDraftAmount(String(amount))
  }, [amount])

  const commitAmount = () => {
    const num = parseInt(draftAmount, 10)
    if (!isNaN(num) && num > 0) {
      onAmountChange(itemId, num)
    } else {
      setDraftAmount(String(amount))
    }
    setEditingAmount(false)
  }

  return (
    <div className={`fav-item-row ${isSelected ? 'fav-selected' : ''}`}>
      <button
        type="button"
        className="fav-check-btn"
        onClick={() => onToggleSelect(itemId)}
        title={isSelected ? t('calcRemoveTarget') : t('calcAddTarget')}
      >
        {isSelected ? '☑' : '☐'}
      </button>
      <span className="fav-item-icon" ref={iconRef} />
      <div className="fav-item-text" title={itemId}>
        <FormattedItemLabel label={label || itemId} className="fav-item-name" />
      </div>
      <input
        className="fav-amount-input"
        type="number"
        min="1"
        value={editingAmount ? draftAmount : amount}
        onFocus={() => {
          setEditingAmount(true)
          setDraftAmount(String(amount))
        }}
        onBlur={commitAmount}
        onChange={(e) => setDraftAmount(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitAmount()
          if (e.key === 'Escape') {
            setDraftAmount(String(amount))
            setEditingAmount(false)
          }
        }}
      />
      <button
        type="button"
        className="fav-remove-btn"
        onClick={() => onRemove(itemId)}
        title={t('favoritesRemove')}
      >
        ×
      </button>
    </div>
  )
}
