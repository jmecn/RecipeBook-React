import { useCallback, useState } from 'react'
import type { CalcPreferences } from '../model/types'
import { DEFAULT_PREFS } from '../model/types'

const RECIPE_KEY = 'tfg-recipe-selections'
const TAG_ITEM_KEY = 'tfg-tag-item-selections'
const TAG_FLUID_KEY = 'tfg-tag-fluid-selections'

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function useCalcPreferences() {
  const [prefs, setPrefs] = useState<CalcPreferences>(() => ({
    recipeSelections: loadJson(RECIPE_KEY, DEFAULT_PREFS.recipeSelections),
    tagItemSelections: loadJson(TAG_ITEM_KEY, DEFAULT_PREFS.tagItemSelections),
    tagFluidSelections: loadJson(TAG_FLUID_KEY, DEFAULT_PREFS.tagFluidSelections),
  }))

  const setRecipeSelection = useCallback((materialId: string, recipeId: string | null) => {
    setPrefs(prev => {
      const next = { ...prev.recipeSelections }
      if (recipeId) {
        next[materialId] = recipeId
      } else {
        delete next[materialId]
      }
      saveJson(RECIPE_KEY, next)
      return { ...prev, recipeSelections: next }
    })
  }, [])

  const setTagItemSelection = useCallback((tagId: string, itemId: string | null) => {
    setPrefs(prev => {
      const next = { ...prev.tagItemSelections }
      if (itemId) {
        next[tagId] = itemId
      } else {
        delete next[tagId]
      }
      saveJson(TAG_ITEM_KEY, next)
      return { ...prev, tagItemSelections: next }
    })
  }, [])

  const setTagFluidSelection = useCallback((tagId: string, fluidId: string | null) => {
    setPrefs(prev => {
      const next = { ...prev.tagFluidSelections }
      if (fluidId) {
        next[tagId] = fluidId
      } else {
        delete next[tagId]
      }
      saveJson(TAG_FLUID_KEY, next)
      return { ...prev, tagFluidSelections: next }
    })
  }, [])

  const clearPrefs = useCallback(() => {
    localStorage.removeItem(RECIPE_KEY)
    localStorage.removeItem(TAG_ITEM_KEY)
    localStorage.removeItem(TAG_FLUID_KEY)
    setPrefs(DEFAULT_PREFS)
  }, [])

  return {
    prefs,
    setRecipeSelection,
    setTagItemSelection,
    setTagFluidSelection,
    clearPrefs,
  }
}
