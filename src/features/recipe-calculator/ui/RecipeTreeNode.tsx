import { useCallback, useMemo } from 'react'
import type { CalcNode } from '../model/types'
import { MaterialIcon } from './MaterialIcon'
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel'
import { formatMaterialAmount, resolveLabel } from '../lib/utils'

interface RecipeTreeNodeProps {
  node: CalcNode
  bundleId: string
  baseUrl: string
  locale: string
  langLabels: Record<string, string>
  collapsed: Record<string, boolean>
  tagItemSelections: Record<string, string>
  tagFluidSelections: Record<string, string>
  onSelectRecipe: (materialId: string) => void
  onCollapse: (materialId: string) => void
  onClearSelection: (materialId: string) => void
  onSelectTag: (tagId: string, anchorEl: HTMLElement) => void
  onClearTagSelection: (tagId: string) => void
}

export function RecipeTreeNode({
  node,
  bundleId,
  baseUrl,
  locale,
  langLabels,
  collapsed,
  tagItemSelections,
  tagFluidSelections,
  onSelectRecipe,
  onCollapse,
  onClearSelection,
  onSelectTag,
  onClearTagSelection,
}: RecipeTreeNodeProps) {
  const hasRecipe = node.recipe !== null
  const hasAvailableRecipes = node.availableRecipes.length > 0
  const isRoot = node.depth === 0
  const isClickable = hasRecipe || (!isRoot) || hasAvailableRecipes
  const isCollapsed = collapsed[node.materialId] === true

  const label = resolveLabel(langLabels, node.materialId)
  const amountDisplay = formatMaterialAmount(node.kind, node.amount)

  const handleClick = useCallback(() => {
    if (hasRecipe) {
      onCollapse(node.materialId)
    } else {
      onSelectRecipe(node.materialId)
    }
  }, [hasRecipe, node.materialId, onCollapse, onSelectRecipe])

  const toggleIcon = hasRecipe ? (isCollapsed ? '\u25B6' : '\u25BC') : '\u25B6'

  const recipeShortId = node.recipe
    ? node.recipe.recipeId.length > 40
      ? node.recipe.recipeId.slice(0, 37) + '...'
      : node.recipe.recipeId
    : ''

  const showChildren = hasRecipe && !isCollapsed

  const tagInputs = useMemo(() => {
    if (!node.recipe || !showChildren) return []
    return node.recipe.inputs.filter(inp => inp.tagId && !inp.catalyst)
  }, [node.recipe, showChildren])

  return (
    <div className="calc-tree-node">
      <div
        className={`calc-tree-row${isClickable ? ' is-clickable' : ''}${isRoot ? ' is-root' : ''}`}
        onClick={isClickable ? handleClick : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={(e) => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) handleClick()
        }}
      >
        <span className="calc-tree-toggle">{toggleIcon}</span>
        <MaterialIcon
          itemId={node.materialId}
          bundleId={bundleId}
          baseUrl={baseUrl}
          locale={locale}
        />
        <div className="calc-tree-label" title={node.materialId}>
          <FormattedItemLabel label={label} className="calc-tree-label-inner" />
        </div>
        <span className="calc-tree-amount">x {amountDisplay}</span>
        {hasRecipe && (
          <span className="calc-tree-recipe" title={node.recipe?.recipeId}>
            [{recipeShortId}] {hasAvailableRecipes ? 'x'+node.multiplier : ''}
          </span>
        )}
        {hasRecipe && (
          <button
            type="button"
            className="calc-tree-clear-btn"
            title="Clear recipe selection"
            onClick={(e) => {
              e.stopPropagation()
              onClearSelection(node.materialId)
            }}
          >
            &times;
          </button>
        )}
        {!hasRecipe && hasAvailableRecipes && (
          <span className="calc-tree-recipes-badge">
            [{node.availableRecipes.length} recipes]
          </span>
        )}
      </div>
      {tagInputs.length > 0 && (
        <div className="calc-tree-children">
          {tagInputs.map((inp) => {
            const tagId = inp.tagId!
            const isTagItem = inp.kind === 'item'
            const tagSelections = isTagItem ? tagItemSelections : tagFluidSelections
            const selectedId = tagSelections[tagId]
            const resolvedId = selectedId || inp.id
            const resolvedLabel = resolveLabel(langLabels, resolvedId)
            const hasSelection = Boolean(selectedId)
            return (
              <div key={tagId} className="calc-tree-row is-tag-input">
                <span className="calc-tree-toggle">+</span>
                <MaterialIcon
                  itemId={resolvedId}
                  bundleId={bundleId}
                  baseUrl={baseUrl}
                  locale={locale}
                />
                <div className="calc-tree-label" title={`Tag: ${tagId}`}>
                  <FormattedItemLabel label={resolvedLabel} className="calc-tree-label-inner" />
                </div>
                <span className="calc-tree-tag-id">{tagId.split(':')[1] || tagId}</span>
                {hasSelection && (
                  <button
                    type="button"
                    className="calc-tree-clear-btn"
                    title="Reset to default"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearTagSelection(tagId)
                    }}
                  >
                    &times;
                  </button>
                )}
                <button
                  type="button"
                  className="calc-tree-select-btn"
                  title="Select tag item"
                  ref={(el) => {
                    if (el) el.dataset.tagId = tagId
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectTag(tagId, e.currentTarget)
                  }}
                >
                  {hasSelection ? '\u21BB' : '\u00B7\u00B7\u00B7'}
                </button>
              </div>
            )
          })}
        </div>
      )}
      {showChildren && node.children.length > 0 && (
        <div className="calc-tree-children">
          {node.children.map((child, index) => (
            <RecipeTreeNode
              key={`${child.materialId}:${index}`}
              node={child}
              bundleId={bundleId}
              baseUrl={baseUrl}
              locale={locale}
              langLabels={langLabels}
              collapsed={collapsed}
              tagItemSelections={tagItemSelections}
              tagFluidSelections={tagFluidSelections}
              onSelectRecipe={onSelectRecipe}
              onCollapse={onCollapse}
              onClearSelection={onClearSelection}
              onSelectTag={onSelectTag}
              onClearTagSelection={onClearTagSelection}
            />
          ))}
        </div>
      )}
      {showChildren && node.byproducts.length > 0 && (
        <div className="calc-tree-children">
          {node.byproducts.map((bp, index) => {
            const bpLabel = resolveLabel(langLabels, bp.id)
            const bpAmount = formatMaterialAmount(bp.kind, bp.amount)
            return (
              <div key={`bp:${bp.id}:${index}`} className="calc-tree-row is-byproduct">
                <span className="calc-tree-toggle">+</span>
                <MaterialIcon
                  itemId={bp.id}
                  bundleId={bundleId}
                  baseUrl={baseUrl}
                  locale={locale}
                />
                <div className="calc-tree-label" title={bp.id}>
                  <FormattedItemLabel label={bpLabel} className="calc-tree-label-inner" />
                </div>
                <span className="calc-tree-amount">x {bpAmount}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}