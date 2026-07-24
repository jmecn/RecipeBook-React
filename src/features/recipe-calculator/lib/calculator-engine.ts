import type {
  CalcRecipe,
  CalcRecipeSummary,
  CalcMaterial,
  CalcNode,
  CalculatorState,
} from '../model/types'


export function mergeAmounts(list: CalcMaterial[]): CalcMaterial[] {
  const map = new Map<string, CalcMaterial>()
  for (const m of list) {
    const key = `${m.kind}:${m.id}`
    const existing = map.get(key)
    if (existing) {
      existing.amount += m.amount
    } else {
      map.set(key, { ...m })
    }
  }
  return Array.from(map.values())
}

export function deduplicateMaterials(list: CalcMaterial[]): CalcMaterial[] {
  const seen = new Set<string>()
  const result: CalcMaterial[] = []
  for (const m of list) {
    const key = `${m.kind}:${m.id}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ ...m })
    }
  }
  return result
}

export interface BuildTreeInput {
  materialId: string
  kind: 'item' | 'fluid'
  amount: number
  depth: number
}

export function buildTree(
  input: BuildTreeInput,
  recipeMap: Map<string, CalcRecipe>,
  getRecipesForItem: (materialId: string) => CalcRecipeSummary[],
  selections: Record<string, string>,
  visited: Set<string> = new Set(),
  tagItemSelections: Record<string, string> = {},
  tagFluidSelections: Record<string, string> = {},
  tagId?: string,
): CalcNode {
  const { materialId, kind, amount, depth } = input

  const availableRecipes = getRecipesForItem(materialId)
  let selectedRecipeId = selections[materialId]

  if (!selectedRecipeId && availableRecipes.length === 1) {
    selectedRecipeId = availableRecipes[0].recipeId
  }

  if (availableRecipes.length === 0 && !selectedRecipeId) {
    return {
      materialId,
      kind,
      amount,
      recipe: null,
      multiplier: 0,
      children: [],
      byproducts: [],
      catalysts: [],
      availableRecipes: [],
      depth,
      tagId,
    }
  }

  if (!selectedRecipeId) {
    return {
      materialId,
      kind,
      amount,
      recipe: null,
      multiplier: 0,
      children: [],
      byproducts: [],
      catalysts: [],
      availableRecipes,
      depth,
      tagId,
    }
  }

  const recipe = recipeMap.get(selectedRecipeId)
  if (!recipe) {
    return {
      materialId,
      kind,
      amount,
      recipe: null,
      multiplier: 0,
      children: [],
      byproducts: [],
      catalysts: [],
      availableRecipes,
      depth,
      tagId,
    }
  }

  if (visited.has(selectedRecipeId)) {
    return {
      materialId,
      kind,
      amount,
      recipe,
      multiplier: 0,
      children: [],
      byproducts: [],
      catalysts: [],
      availableRecipes,
      depth,
      tagId,
    }
  }

  const multiplier = Math.ceil(amount / recipe.targetOutputAmount)
  visited.add(selectedRecipeId)

  const children: CalcNode[] = []
  const catalysts: CalcMaterial[] = []
  for (const inp of recipe.inputs) {
    if (inp.catalyst) {
      if (inp.id) {
        catalysts.push({ id: inp.id, kind: inp.kind, amount: inp.amount })
      }
      continue
    }
    const childAmount = inp.amount * multiplier
    if (childAmount <= 0) continue
    if (!inp.id) continue

    let resolvedId = inp.id
    if (inp.tagId) {
      if (inp.kind === 'fluid' && tagFluidSelections[inp.tagId]) {
        resolvedId = tagFluidSelections[inp.tagId]
      } else if (inp.kind === 'item' && tagItemSelections[inp.tagId]) {
        resolvedId = tagItemSelections[inp.tagId]
      }
    }

    const child = buildTree(
      { materialId: resolvedId, kind: inp.kind, amount: childAmount, depth: depth + 1 },
      recipeMap,
      getRecipesForItem,
      selections,
      visited,
      tagItemSelections,
      tagFluidSelections,
      inp.tagId,
    )
    children.push(child)
    catalysts.push(...child.catalysts)
  }

  visited.delete(selectedRecipeId)

  const byproducts: CalcMaterial[] = []
  for (const out of recipe.outputs) {
    if (out.id !== materialId) {
      byproducts.push({ id: out.id, kind: out.kind, amount: out.amount * multiplier })
    }
  }

  return {
    materialId,
    kind,
    amount,
    recipe,
    multiplier,
    children,
    byproducts: mergeAmounts(byproducts),
    catalysts: deduplicateMaterials(catalysts),
    availableRecipes,
    depth,
    tagId,
  }
}

export function flattenTree(node: CalcNode): {
  rawMaterials: CalcMaterial[]
  byproducts: CalcMaterial[]
  catalysts: CalcMaterial[]
} {
  const rawMaterials: CalcMaterial[] = []
  const allByproducts: CalcMaterial[] = []
  const allCatalysts: CalcMaterial[] = []

  function recurse(n: CalcNode) {
    if (n.byproducts.length > 0) {
      allByproducts.push(...n.byproducts)
    }
    if (n.catalysts.length > 0) {
      allCatalysts.push(...n.catalysts)
    }

    if (n.recipe === null && n.children.length === 0) {
      rawMaterials.push({ id: n.materialId, kind: n.kind, amount: n.amount })
      return
    }

    for (const child of n.children) {
      recurse(child)
    }
  }

  recurse(node)

  return {
    rawMaterials: mergeAmounts(rawMaterials),
    byproducts: mergeAmounts(allByproducts),
    catalysts: deduplicateMaterials(allCatalysts),
  }
}

export function countTreeStats(node: CalcNode): { recipeCount: number; maxDepth: number } {
  let recipeCount = 0
  let maxDepth = node.depth

  function recurse(n: CalcNode) {
    if (n.recipe) recipeCount++
    if (n.depth > maxDepth) maxDepth = n.depth
    for (const child of n.children) {
      recurse(child)
    }
  }

  recurse(node)
  return { recipeCount, maxDepth }
}

export function createEmptyState(): CalculatorState {
  return { targets: [], selections: {} }
}
