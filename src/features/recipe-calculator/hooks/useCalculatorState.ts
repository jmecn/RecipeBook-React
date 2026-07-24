import { useCallback, useRef, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppRoute } from '../../../shared/hooks/useAppRoute'
import { buildNavUrl } from '../../../shared/lib/location-query'
import { encodeCalcState, decodeCalcState } from '../../../shared/lib/calc-base64'
import type { CalculatorState } from '../model/types'

const SELECTIONS_KEY = 'tfg-recipe-selections'
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

export function useCalculatorState(): {
  state: CalculatorState
  addTarget: (itemId: string, amount?: number) => void
  removeTarget: (index: number) => void
  setTargetAmount: (index: number, amount: number) => void
  setSelection: (materialId: string, recipeId: string | null) => void
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

  const [selections, setSelectionsState] = useState<Record<string, string>>(
    () => loadJson(SELECTIONS_KEY, {}),
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

  const targets = useMemo(() => {
    const encoded = route.calc
    if (!encoded) return []
    const state = decodeCalcState(encoded)
    return state?.targets ?? []
  }, [route.calc])

  const state: CalculatorState = useMemo(() => ({
    targets,
    selections,
  }), [targets, selections])

  const pushTargets = useCallback((newTargets: CalculatorState['targets']) => {
    const encoded = encodeCalcState({ targets: newTargets, selections: {} })
    navigate(buildNavUrl(route, { view: 'calculator', calc: encoded }), { replace: true })
  }, [navigate, route])

  const saveSelections = useCallback((next: Record<string, string>) => {
    setSelectionsState(next)
    saveJson(SELECTIONS_KEY, next)
  }, [])

  const addTarget = useCallback((itemId: string, amount: number = 1) => {
    pushTargets([...targets, { itemId, amount }])
  }, [targets, pushTargets])

  const removeTarget = useCallback((index: number) => {
    pushTargets(targets.filter((_, i) => i !== index))
  }, [targets, pushTargets])

  const setTargetAmount = useCallback((index: number, amount: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const safe = Math.max(1, Math.floor(amount) || 1)
    debounceRef.current = setTimeout(() => {
      pushTargets(targets.map((t, i) => i === index ? { ...t, amount: safe } : t))
    }, 300)
  }, [targets, pushTargets])

  const setSelection = useCallback((materialId: string, recipeId: string | null) => {
    const nextSelections = { ...selections }
    if (recipeId) {
      nextSelections[materialId] = recipeId
    } else {
      delete nextSelections[materialId]
    }
    saveSelections(nextSelections)
  }, [selections, saveSelections])

  const importState = useCallback((newState: CalculatorState) => {
    saveSelections(newState.selections)
    pushTargets(newState.targets)
  }, [pushTargets, saveSelections])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return {
    state,
    addTarget,
    removeTarget,
    setTargetAmount,
    setSelection,
    importState,
    tagItemSelections: tagItemSelections,
    tagFluidSelections: tagFluidSelections,
    setTagItemSelection: setTagItemSelection,
  }
}
