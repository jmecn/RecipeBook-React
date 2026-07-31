import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { stripRegistryId } from 'emi-recipe-renderer'
import { bundleBaseUrl, fetchJson } from '../../../shared/api/http'
import { recipePathCandidates } from '../../../shared/lib/bundle'
import type { RecipeMetaData, CalcRecipeSummary, CalcRecipe, CalcRecipeInput, CalcMaterial } from './types'

const EXCLUDED_CATEGORIES = new Set(['create:automatic_shaped'])



function defaultAmount(kind: string, interaction: { amount?: number; amountMb?: number }): number {
  if (kind === 'fluid') return interaction.amountMb ?? 0
  return interaction.amount ?? 1
}

export function parseMetaToRecipe(meta: RecipeMetaData, targetItemId: string): CalcRecipe | null {
  const inputs: CalcRecipeInput[] = []
  const outputs: CalcMaterial[] = []
  let targetOutputAmount = 1

  for (const widget of meta.widgets) {
    const { interaction, role } = widget
    const { kind } = interaction

    if (kind === 'item') {
      const material: CalcMaterial = {
        id: stripRegistryId(interaction.id ?? ''),
        kind: 'item',
        amount: defaultAmount(kind, interaction),
      }
      if (role === 'output') {
        outputs.push(material)
        if (material.id === targetItemId) targetOutputAmount = material.amount
      } else if (role === 'input') {
        inputs.push({ ...material, catalyst: false })
      } else if (role === 'catalyst') {
        inputs.push({ id: material.id, kind: 'item', amount: Math.max(material.amount, 1), catalyst: true })
      }
    }

    if (kind === 'fluid') {
      const material: CalcMaterial = {
        id: interaction.id ?? '',
        kind: 'fluid',
        amount: interaction.amountMb ?? 0,
      }
      if (role === 'output') {
        outputs.push(material)
        if (material.id === targetItemId) targetOutputAmount = material.amount
      } else if (role === 'input') {
        inputs.push({ ...material, catalyst: false })
      } else if (role === 'catalyst') {
        inputs.push({ id: material.id, kind: 'fluid', amount: Math.max(material.amount, 1), catalyst: true })
      }
    }

    if (kind === 'tag') {
      const rawDisplayId = interaction.displayId ?? interaction.tag ?? ''
      const displayId = stripRegistryId(rawDisplayId)
      inputs.push({
        id: displayId,
        kind: interaction.tagKind === 'fluid' ? 'fluid' : 'item',
        amount: interaction.amount ?? 1,
        catalyst: role === 'catalyst',
        tagId: interaction.tag,
        tagKind: interaction.tagKind,
      })
    }

    if (kind === 'list') {
      for (const entry of interaction.entries ?? []) {
        if (entry.kind === 'item' || entry.kind === 'fluid') {
          const entryKind: 'item' | 'fluid' = entry.kind === 'fluid' ? 'fluid' : 'item'
          const mat: CalcMaterial = {
            id: stripRegistryId(entry.id ?? ''),
            kind: entryKind,
            amount: defaultAmount(entry.kind, entry),
          }
          if (role === 'output') {
            outputs.push(mat)
            if (mat.id === targetItemId) targetOutputAmount = mat.amount
          } else if (role === 'input') {
            inputs.push({ ...mat, catalyst: false })
          }
        }
      }
    }
  }

  const mergedInputs: CalcRecipeInput[] = []
  for (const inp of inputs) {
    const key = `${inp.kind}:${inp.id}:${inp.catalyst}`
    const existing = mergedInputs.find(m => `${m.kind}:${m.id}:${m.catalyst}` === key)
    if (existing) {
      existing.amount += inp.amount
    } else {
      mergedInputs.push({ ...inp })
    }
  }

  return {
    recipeId: meta.id,
    category: meta.category ?? 'unknown',
    inputs: mergedInputs,
    outputs,
    targetOutputAmount: targetOutputAmount > 0 ? targetOutputAmount : 1,
  }
}

export async function loadItemOutputs(bundleId: string, itemId: string): Promise<Record<string, string[]>> {
  const idx = itemId.indexOf(':')
  if (idx <= 0 || idx >= itemId.length - 1) return {}
  const p = `items/${itemId.slice(0, idx)}/${itemId.slice(idx + 1)}.json`
  const data = await fetchJson<{ outputs?: Record<string, string[]> } | null>(
    `${bundleBaseUrl(bundleId)}${p}`,
    null,
  )
  return data?.outputs ?? {}
}

export function useItemOutputs(bundleId: string, itemId: string) {
  return useQuery({
    queryKey: ['item-outputs', bundleId, itemId],
    enabled: Boolean(bundleId) && Boolean(itemId) && itemId.includes(':'),
    queryFn: () => loadItemOutputs(bundleId, itemId),
  })
}

export function useAllRecipeOutputs(
  bundleId: string,
  itemId: string,
  itemOutputs: Record<string, string[]> | undefined,
) {
  const allRecipeIds = useMemo(() => {
    if (!itemOutputs) return []
    const seen = new Set<string>()
    for (const [, ids] of Object.entries(itemOutputs)) {
      for (const id of ids) {
        if (id && typeof id === 'string') seen.add(id)
      }
    }
    return Array.from(seen)
  }, [itemOutputs])

  return useQuery({
    queryKey: ['all-recipe-outputs', bundleId, itemId, allRecipeIds],
    enabled: Boolean(bundleId) && allRecipeIds.length > 0,
    queryFn: async (): Promise<Map<string, CalcRecipeSummary[]>> => {
      const metaMap = new Map<string, CalcRecipeSummary>()
      const queue = [...allRecipeIds]

      async function worker() {
        while (queue.length > 0) {
          const recipeId = queue.shift()!
          const candidates = recipePathCandidates(recipeId)
          for (const relPath of candidates) {
            const url = `${bundleBaseUrl(bundleId)}${relPath}`
            const meta = await fetchJson<RecipeMetaData | null>(url, null)
            if (!meta || !meta.id) continue
            const recipe = parseMetaToRecipe(meta, itemId)
            if (!recipe) continue
            if (EXCLUDED_CATEGORIES.has(recipe.category)) continue
            metaMap.set(recipeId, {
              recipeId: recipe.recipeId,
              category: recipe.category,
              outputAmount: recipe.targetOutputAmount,
            })
            break
          }
        }
      }

      const poolSize = Math.min(CONCURRENCY, allRecipeIds.length)
      if (poolSize > 0) {
        const workers = Array.from({ length: poolSize }, () => worker())
        await Promise.all(workers)
      }

      const byItem = new Map<string, CalcRecipeSummary[]>()
      for (const summary of metaMap.values()) {
        const arr = byItem.get(itemId) ?? []
        arr.push(summary)
        byItem.set(itemId, arr)
      }

      return byItem
    },
  })
}

const recipeMetaCache = new Map<string, CalcRecipe>()

export function useRecipeMetas(
  bundleId: string,
  selections: Record<string, string>,
) {
  const recipeIds = useMemo(() => {
    const ids = new Set(Object.values(selections).filter(Boolean))
    return Array.from(ids)
  }, [selections])

  return useQuery({
    queryKey: ['recipe-metas', bundleId, recipeIds],
    enabled: Boolean(bundleId) && recipeIds.length > 0,
    queryFn: async (): Promise<Map<string, CalcRecipe>> => {
      const result = new Map<string, CalcRecipe>()
      const needFetch: string[] = []

      for (const recipeId of recipeIds) {
        const key = `${bundleId}:${recipeId}`
        const cached = recipeMetaCache.get(key)
        if (cached) {
          result.set(recipeId, cached)
        } else {
          needFetch.push(recipeId)
        }
      }

      if (needFetch.length > 0) {
        const queue = [...needFetch]
        const selectionMap = new Map(Object.entries(selections))

        async function worker() {
          while (queue.length > 0) {
            const recipeId = queue.shift()!
            const targetItemId = Array.from(selectionMap.entries())
              .find(([, rId]) => rId === recipeId)?.[0] ?? ''
            const candidates = recipePathCandidates(recipeId)
            for (const relPath of candidates) {
              const url = `${bundleBaseUrl(bundleId)}${relPath}`
              const meta = await fetchJson<RecipeMetaData | null>(url, null)
              if (!meta || !meta.id) continue
              const recipe = parseMetaToRecipe(meta, targetItemId)
              if (recipe) {
                recipeMetaCache.set(`${bundleId}:${recipeId}`, recipe)
                result.set(recipeId, recipe)
              }
              break
            }
          }
        }

        const poolSize = Math.min(CONCURRENCY, needFetch.length)
        const workers = Array.from({ length: poolSize }, () => worker())
        await Promise.all(workers)
      }

      return result
    },
  })
}

const CONCURRENCY = 16

async function fetchRecipeMeta(
  bundleId: string,
  itemId: string,
  recipeId: string,
): Promise<{ summary: CalcRecipeSummary | null; bytes: number }> {
  const candidates = recipePathCandidates(recipeId)
  for (const relPath of candidates) {
    const url = `${bundleBaseUrl(bundleId)}${relPath}`
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const ct = String(res.headers.get('content-type') || '').toLowerCase()
      if (!ct.includes('application/json')) continue
      const text = await res.text()
      const bytes = new TextEncoder().encode(text).length
      const meta: RecipeMetaData | null = JSON.parse(text)
      if (!meta || !meta.id) continue
      const recipe = parseMetaToRecipe(meta, itemId)
      if (!recipe) continue
      return {
        summary: {
          recipeId: recipe.recipeId,
          category: recipe.category,
          outputAmount: recipe.targetOutputAmount,
        },
        bytes,
      }
    } catch {
      continue
    }
    break
  }
  return { summary: null, bytes: 0 }
}

export function useRecipeMetasByIds(
  bundleId: string,
  itemId: string,
  recipeIds: string[],
  onProgress?: (loaded: number, total: number, bytes: number) => void,
) {
  return useQuery({
    queryKey: ['recipe-metas-by-ids', bundleId, itemId, recipeIds],
    enabled: Boolean(bundleId) && recipeIds.length > 0,
    queryFn: async (): Promise<CalcRecipeSummary[]> => {
      const results: CalcRecipeSummary[] = []
      let loaded = 0
      let cumBytes = 0
      const total = recipeIds.length
      const queue = [...recipeIds]

      async function worker() {
        while (queue.length > 0) {
          const recipeId = queue.shift()!
          const { summary, bytes } = await fetchRecipeMeta(bundleId, itemId, recipeId)
          if (summary) results.push(summary)
          cumBytes += bytes
          loaded++
          onProgress?.(loaded, total, cumBytes)
        }
      }

      const poolSize = Math.min(CONCURRENCY, total)
      if (poolSize > 0) {
        const workers = Array.from({ length: poolSize }, () => worker())
        await Promise.all(workers)
      }

      return results
    },
  })
}