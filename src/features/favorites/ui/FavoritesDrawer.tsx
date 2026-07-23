import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import type { FavoriteItem } from '../model/types'
import { FavoriteItemRow } from './FavoriteItemRow'

interface FavoritesDrawerProps {
  baseUrl: string
  locale: string
  labels?: Record<string, string>
  isOpen: boolean
  onToggle: () => void
  favorites: FavoriteItem[]
  onRemoveFavorite: (itemId: string) => void
  selectedItems: Array<{ itemId: string; amount: number }>
  onCalculate: (items: Array<{ itemId: string; amount: number }>) => void
  onAddTarget: (itemId: string, amount: number) => void
  onRemoveTarget: (itemId: string) => void
}

const AMOUNTS_STORAGE_KEY = 'tfg-favorite-amounts'

function loadAmounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(AMOUNTS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function saveAmounts(amounts: Record<string, number>) {
  localStorage.setItem(AMOUNTS_STORAGE_KEY, JSON.stringify(amounts))
}

export function FavoritesDrawer({
  baseUrl,
  locale,
  labels,
  isOpen,
  onToggle,
  favorites,
  onRemoveFavorite,
  selectedItems,
  onCalculate,
  onAddTarget,
  onRemoveTarget,
}: FavoritesDrawerProps) {
  const { t } = useI18n()
  const [amounts, setAmounts] = useState<Record<string, number>>(loadAmounts)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        if (isOpen) onToggle()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  const selectedSet = useMemo(() => {
    return new Set(selectedItems.map(i => i.itemId))
  }, [selectedItems])

  const handleToggleSelect = (itemId: string) => {
    if (selectedSet.has(itemId)) {
      onRemoveTarget(itemId)
    } else {
      const amount = amounts[itemId] || 1
      onAddTarget(itemId, amount)
    }
  }

  const handleAmountChange = (itemId: string, amount: number) => {
    setAmounts(prev => {
      const next = { ...prev, [itemId]: amount }
      saveAmounts(next)
      return next
    })
    if (selectedSet.has(itemId)) {
      onRemoveTarget(itemId)
      onAddTarget(itemId, amount)
    }
  }

  const handleCalculate = () => {
    const items = favorites
      .filter(fav => selectedSet.has(fav.itemId))
      .map(fav => ({
        itemId: fav.itemId,
        amount: amounts[fav.itemId] || 1,
      }))
    if (items.length > 0) {
      onCalculate(items)
    }
  }

  const selectedCount = favorites.filter(f => selectedSet.has(f.itemId)).length

  return (
    <>
      <button
        type="button"
        className="fav-toggle-btn"
        onClick={onToggle}
        title={t('favoritesTitle')}
      >
        {isOpen ? '◀' : '▶'}
        <span className="fav-toggle-badge">{favorites.length}</span>
      </button>

      <div className={`fav-drawer ${isOpen ? 'fav-drawer-open' : ''}`} ref={drawerRef}>
        <div className="fav-drawer-header">
          <h3 className="fav-drawer-title">{t('favoritesTitle')}</h3>
          <button
            type="button"
            className="fav-drawer-close"
            onClick={onToggle}
          >
            ×
          </button>
        </div>

        <div className="fav-drawer-content">
          {favorites.length === 0 ? (
            <div className="fav-empty">
              {t('favoritesEmpty')}
            </div>
          ) : (
            favorites.map(fav => (
              <FavoriteItemRow
                key={fav.itemId}
                itemId={fav.itemId}
                label={labels?.[fav.itemId]}
                isSelected={selectedSet.has(fav.itemId)}
                amount={amounts[fav.itemId] || 1}
                baseUrl={baseUrl}
                locale={locale}
                onToggleSelect={handleToggleSelect}
                onRemove={onRemoveFavorite}
                onAmountChange={handleAmountChange}
              />
            ))
          )}
        </div>

        {favorites.length > 0 && (
          <div className="fav-drawer-footer">
            <button
              type="button"
              className="fav-calculate-btn"
              disabled={selectedCount === 0}
              onClick={handleCalculate}
            >
              {t('favoritesCalcButton')} ({selectedCount})
            </button>
          </div>
        )}
      </div>
    </>
  )
}
