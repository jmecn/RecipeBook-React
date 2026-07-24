import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../../shared/i18n/useI18n'
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client'
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel'
import { FavoriteAddButton } from './FavoriteAddButton'
import { RecipeIdCopyButton } from '../../../shared/ui/RecipeIdCopyButton'
import { buildNavUrl, type AppRoute } from '../../../shared/lib/location-query'
import { lookupItemLabel } from '../../../shared/lib/item-labels'

interface FavoriteItemRowProps {
  itemId: string
  label?: string
  isSelected: boolean
  baseUrl: string
  locale: string
  route: AppRoute
  onToggleSelect: (itemId: string) => void
  onRemove: (itemId: string) => void
  onToggleFavorite: (itemId: string) => void
}

export function FavoriteItemRow({
  itemId,
  label,
  isSelected,
  baseUrl,
  locale,
  route,
  onToggleSelect,
  onRemove,
  onToggleFavorite,
}: FavoriteItemRowProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const iconRef = useRef<HTMLSpanElement | null>(null)
  const client = useMemo(() => getEmiRendererClient(), [])
  const displayLabel = label ?? lookupItemLabel(null, itemId)
  const copyItemIdLabels = useMemo(
    () => ({ copyAria: t('copyAria'), copiedAria: t('copiedAria') }),
    [t],
  )

  useEffect(() => {
    const host = iconRef.current
    if (!host) return
    const session = client.mountItemIcon(host, { itemId, baseUrl, locale })
    return () => session.disconnect()
  }, [baseUrl, client, itemId, locale])

  const handleNav = () => {
    navigate(buildNavUrl(route, { view: 'item', id: itemId, lang: locale }))
  }

  return (
    <div className={`fav-item-row ${isSelected ? 'fav-selected' : ''}`} onClick={handleNav}>
      <button
        type="button"
        className="fav-check-btn"
        onClick={(e) => { e.stopPropagation(); onToggleSelect(itemId) }}
        title={isSelected ? t('calcRemoveTarget') : t('calcAddTarget')}
      >
        {isSelected ? '☑' : '☐'}
      </button>
      <span className="fav-item-icon" ref={iconRef} />
      <div className="fav-item-text" title={itemId}>
        <FormattedItemLabel label={displayLabel} className="fav-item-name" />
        <span className="fav-item-id-row">
          <span className="fav-item-id">{itemId}</span>
          <span onClick={(e) => e.stopPropagation()}>
            <RecipeIdCopyButton recipeId={itemId} labels={copyItemIdLabels} />
          </span>
        </span>
      </div>
      <FavoriteAddButton itemId={itemId} isFavorite={true} onToggle={onToggleFavorite} />
      <button
        type="button"
        className="fav-remove-btn"
        onClick={(e) => { e.stopPropagation(); onRemove(itemId) }}
        title={t('favoritesRemove')}
      >
        ×
      </button>
    </div>
  )
}
