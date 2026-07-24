import { useEffect, useMemo, useRef } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'
import type { FavoriteItem } from '../model/types'
import { FavoriteItemRow } from './FavoriteItemRow'
import type { AppRoute } from '../../../shared/lib/location-query'

interface FavoritesDrawerProps {
  baseUrl: string
  locale: string
  labels?: Record<string, string>
  route: AppRoute
  isOpen: boolean
  onToggle: () => void
  favorites: FavoriteItem[]
  onRemoveFavorite: (itemId: string) => void
  onToggleFavorite: (itemId: string) => void
  selectedItems: Array<{ itemId: string; amount: number }>
  onCalculate: (items: Array<{ itemId: string; amount: number }>) => void
  onAddTarget: (itemId: string, amount: number) => void
  onRemoveTarget: (itemId: string) => void
}

export function FavoritesDrawer({
  baseUrl,
  locale,
  labels,
  route,
  isOpen,
  onToggle,
  favorites,
  onRemoveFavorite,
  onToggleFavorite,
  selectedItems,
  onCalculate,
  onAddTarget,
  onRemoveTarget,
}: FavoritesDrawerProps) {
  const { t } = useI18n()
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
      onAddTarget(itemId, 1)
    }
  }

  const handleCalculate = () => {
    const items = favorites
      .filter(fav => selectedSet.has(fav.itemId))
      .map(fav => ({ itemId: fav.itemId, amount: 1 }))
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
                baseUrl={baseUrl}
                locale={locale}
                route={route}
                onToggleSelect={handleToggleSelect}
                onRemove={onRemoveFavorite}
                onToggleFavorite={onToggleFavorite}
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
