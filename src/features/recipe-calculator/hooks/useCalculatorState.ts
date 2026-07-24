import { useCallback, useRef, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppRoute } from '../../../shared/hooks/useAppRoute'
import { buildNavUrl } from '../../../shared/lib/location-query'
import { encodeCalcState, decodeCalcState } from '../../../shared/lib/calc-base64'
import type { CalculatorState } from '../model/types'
import { createEmptyState } from '../lib/calculator-engine'

const SELECTIONS_KEY = 'tfg-recipe-selections'
const TAG_ITEM_KEY = 'tfg-tag-item-selections'
const TAG_FLUID_KEY = 'tfg-tag-fluid-selections'
const COLLAPSED_KEY = 'tfg-calc-collapsed'

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

function mergeSelections(
  urlSelections: Record<string, string>,
  localStorageSelections: Record<string, string>,
  hasUrlSelections: boolean,
): Record<string, string> {
  if (hasUrlSelections) {
    return urlSelections
  }
  return { ...localStorageSelections }
}

export function useCalculatorState(): {
  state: CalculatorState
  addTarget: (itemId: string, amount?: number) => void
  removeTarget: (index: number) => void
  setTargetAmount: (index: number, amount: number) => void
  setSelection: (materialId: string, recipeId: string | null) => void
  toggleCollapsed: (materialId: string) => void
  importState: (newState: CalculatorState) => void
  tagItemSelections: Record<string, string>
  tagFluidSelections: Record<string, string>
  setTagItemSelection: (tagId: string, itemId: string | null) => void
} {
  const navigate = useNavigate()
  const route = useAppRoute()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [tagItemSelections, setTagItemSelectionsState] = useState<Record<string, string>>(
    () => loadJson(TAG_ITEM_KEY, {}),
  )
  const [tagFluidSelections] = useState<Record<string, string>>(
    () => loadJson(TAG_FLUID_KEY, {}),
  )

  const setTagItemSelection = useCallback((tagId: string, itemId: string | null) => {
    setTagItemSelectionsState(prev => {
      const next = { ...prev }
      if (itemId) {
        next[tagId] = itemId
      } else {
        delete next[tagId]
      }
      saveJson(TAG_ITEM_KEY, next)
      return next
    })
  }, [])

  const decoded = useMemo(() => {
    const encoded = route.calc
    if (!encoded) {
      const savedSelections = loadJson<Record<string, string>>(SELECTIONS_KEY, {})
      const savedCollapsed = loadJson<Record<string, boolean>>(COLLAPSED_KEY, {})
      return {
        targets: [],
        selections: savedSelections,
        collapsed: savedCollapsed,
      }
    }
    const urlState = decodeCalcState(encoded)
    if (!urlState) return createEmptyState()

    const hasUrlSelections = Object.keys(urlState.selections).length > 0
    const localStorageSelections = loadJson<Record<string, string>>(SELECTIONS_KEY, {})
    const mergedSelections = mergeSelections(urlState.selections, localStorageSelections, hasUrlSelections)

    const hasUrlCollapsed = Object.keys(urlState.collapsed).length > 0
    const localStorageCollapsed = loadJson<Record<string, boolean>>(COLLAPSED_KEY, {})
    const mergedCollapsed = hasUrlCollapsed ? urlState.collapsed : localStorageCollapsed

    return {
      targets: urlState.targets,
      selections: mergedSelections,
      collapsed: mergedCollapsed,
    }
  }, [route.calc])

  const pushState = useCallback((newState: CalculatorState) => {
    const encoded = encodeCalcState(newState)
    navigate(buildNavUrl(route, { view: 'calculator', calc: encoded }), { replace: true })
  }, [navigate, route])

  const syncPrefs = useCallback((selections: Record<string, string>, collapsed: Record<string, boolean>) => {
    saveJson(SELECTIONS_KEY, selections)
    saveJson(COLLAPSED_KEY, collapsed)
  }, [])

  const addTarget = useCallback((itemId: string, amount: number = 1) => {
    const next = {
      ...decoded,
      targets: [...decoded.targets, { itemId, amount }],
    }
    pushState(next)
  }, [decoded, pushState])

  const removeTarget = useCallback((index: number) => {
    const next = {
      ...decoded,
      targets: decoded.targets.filter((_, i) => i !== index),
    }
    pushState(next)
  }, [decoded, pushState])

  const setTargetAmount = useCallback((index: number, amount: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const safe = Math.max(1, Math.floor(amount) || 1)
    debounceRef.current = setTimeout(() => {
      const next = {
        ...decoded,
        targets: decoded.targets.map((t, i) => i === index ? { ...t, amount: safe } : t),
      }
      pushState(next)
    }, 300)
  }, [decoded, pushState])

  const setSelection = useCallback((materialId: string, recipeId: string | null) => {
    const currentState = decoded
    const nextSelections = { ...currentState.selections }
    if (recipeId) {
      nextSelections[materialId] = recipeId
    } else {
      delete nextSelections[materialId]
    }
    syncPrefs(nextSelections, currentState.collapsed)
    pushState({
      targets: currentState.targets,
      selections: nextSelections,
      collapsed: currentState.collapsed,
    })
  }, [decoded, pushState, syncPrefs])

  const toggleCollapsed = useCallback((materialId: string) => {
    const nextCollapsed = { ...decoded.collapsed }
    if (nextCollapsed[materialId]) {
      delete nextCollapsed[materialId]
    } else {
      nextCollapsed[materialId] = true
    }
    syncPrefs(decoded.selections, nextCollapsed)
    pushState({ ...decoded, collapsed: nextCollapsed })
  }, [decoded, pushState, syncPrefs])

  const importState = useCallback((newState: CalculatorState) => {
    syncPrefs(newState.selections, newState.collapsed)
    pushState(newState)
  }, [pushState, syncPrefs])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return {
    state: decoded,
    addTarget,
    removeTarget,
    setTargetAmount,
    setSelection,
    toggleCollapsed,
    importState,
    tagItemSelections: tagItemSelections,
    tagFluidSelections: tagFluidSelections,
    setTagItemSelection: setTagItemSelection,
  }
}