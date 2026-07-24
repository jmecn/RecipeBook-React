import { useMemo } from 'react'
import { useI18n } from '../../../shared/i18n/useI18n'

interface FavoriteAddButtonProps {
  itemId: string
  isFavorite: boolean
  onToggle: (itemId: string) => void
}

export function FavoriteAddButton({ itemId, isFavorite, onToggle }: FavoriteAddButtonProps) {
  const { t } = useI18n()
  const labels = useMemo(() => ({
    add: t('favoritesAdd'),
    remove: t('favoritesRemove'),
  }), [t])

  return (
    <button
      type="button"
      className={`favorite-add-btn ${isFavorite ? 'favorite-active' : ''}`}
      title={isFavorite ? labels.remove : labels.add}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle(itemId)
      }}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  )
}
