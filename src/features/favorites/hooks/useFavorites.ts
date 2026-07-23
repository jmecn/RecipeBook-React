import { useCallback, useState } from 'react'
import type { FavoriteItem } from '../model/types'

const STORAGE_KEY = 'tfg-favorites'

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveFavorites(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useFavorites() {
  const [itemIds, setItemIds] = useState<string[]>(loadFavorites)

  const addItem = useCallback((itemId: string) => {
    setItemIds(prev => {
      if (prev.includes(itemId)) return prev
      const next = [...prev, itemId]
      saveFavorites(next)
      return next
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItemIds(prev => {
      const next = prev.filter(id => id !== itemId)
      saveFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback((itemId: string) => {
    return itemIds.includes(itemId)
  }, [itemIds])

  const favorites: FavoriteItem[] = itemIds.map(itemId => ({
    itemId,
    addedAt: Date.now(),
  }))

  return {
    favorites,
    itemIds,
    addItem,
    removeItem,
    isFavorite,
    count: itemIds.length,
  }
}
