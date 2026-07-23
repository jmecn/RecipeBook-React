export interface FavoriteItem {
  itemId: string
  addedAt: number
}

export interface CalcPreferences {
  recipeSelections: Record<string, string>
  tagItemSelections: Record<string, string>
  tagFluidSelections: Record<string, string>
}

export const DEFAULT_PREFS: CalcPreferences = {
  recipeSelections: {},
  tagItemSelections: {},
  tagFluidSelections: {},
}
