export interface CalcMaterial {
  id: string
  kind: 'item' | 'fluid'
  amount: number
}

export interface CalcRecipeInput extends CalcMaterial {
  catalyst: boolean
  tagId?: string
  tagKind?: string
}

export interface CalcRecipe {
  recipeId: string
  category: string
  inputs: CalcRecipeInput[]
  outputs: CalcMaterial[]
  targetOutputAmount: number
}

export interface CalcRecipeSummary {
  recipeId: string
  category: string
  outputAmount: number
}

export interface CalcNode {
  materialId: string
  kind: 'item' | 'fluid'
  amount: number
  recipe: CalcRecipe | null
  multiplier: number
  children: CalcNode[]
  byproducts: CalcMaterial[]
  catalysts: CalcMaterial[]
  availableRecipes: CalcRecipeSummary[]
  depth: number
  tagId?: string
}

export interface CalculatorTarget {
  itemId: string
  amount: number
}

export interface CalculatorState {
  targets: CalculatorTarget[]
  selections: Record<string, string>
  collapsed: Record<string, boolean>
}

export interface CalcMaterialSummary {
  id: string
  kind: 'item' | 'fluid'
  amount: number
}

export interface RecipeMetaWidget {
  x: number
  y: number
  w: number
  h: number
  role?: string
  interaction: RecipeMetaInteraction
}

export interface RecipeMetaInteraction {
  kind: 'item' | 'fluid' | 'tag' | 'list' | 'empty'
  id?: string
  amount?: number
  amountMb?: number
  tag?: string
  tagKind?: string
  displayId?: string
  entries?: RecipeMetaInteraction[]
}

export interface RecipeMetaData {
  schema: number
  id: string
  width: number
  height: number
  margin?: number
  category?: string
  widgets: RecipeMetaWidget[]
}