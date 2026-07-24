import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../../shared/i18n/useI18n'
import type { CalcNode } from '../model/types'
import { MaterialIcon } from './MaterialIcon'
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel'
import { buildNavUrl, type AppRoute } from '../../../shared/lib/location-query'
import { formatMaterialAmount, resolveLabel } from '../lib/utils'
import { RecipeTooltip } from './RecipeTooltip'

interface RecipeTreeNodeProps {
  node: CalcNode
  bundleId: string
  baseUrl: string
  locale: string
  langLabels: Record<string, string>
  route: AppRoute
  tagItemSelections: Record<string, string>
  tagFluidSelections: Record<string, string>
  onSelectRecipe: (materialId: string) => void
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
  route,
  tagItemSelections,
  tagFluidSelections,
  onSelectRecipe,
  onClearSelection,
  onSelectTag,
  onClearTagSelection,
}: RecipeTreeNodeProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const hasRecipe = node.recipe !== null

  const label = resolveLabel(langLabels, node.materialId)
  const amountDisplay = formatMaterialAmount(node.kind, node.amount)

  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (!hasRecipe) return
    setTooltipPos({ x: e.clientX + 16, y: e.clientY + 16 })
    hoverTimerRef.current = setTimeout(() => setShowTooltip(true), 200)
  }, [hasRecipe])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!hasRecipe) return
    setTooltipPos({ x: e.clientX + 16, y: e.clientY + 16 })
  }, [hasRecipe])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setShowTooltip(false)
  }, [])

  const detailUrl = node.recipe
    ? buildNavUrl(route, { view: 'recipe', id: node.recipe.recipeId, lang: locale })
    : buildNavUrl(route, { view: 'item', id: node.materialId, lang: locale })

  return (
    <div className="calc-tree-node">
      <div className="calc-tree-row">
        {!hasRecipe && (
          <button
            type="button"
            className="calc-tree-recipe-btn"
            title={t('calcSelectTag')}
            onClick={() => onSelectRecipe(node.materialId)}
          >
            +
          </button>
        )}
        {hasRecipe && (
          <button
            type="button"
            className="calc-tree-recipe-btn"
            title={t('calcClearRecipe')}
            onClick={() => onClearSelection(node.materialId)}
          >
            {'\u2212'}
          </button>
        )}
        <span
          className="calc-tree-info"
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <MaterialIcon
            itemId={node.materialId}
            bundleId={bundleId}
            baseUrl={baseUrl}
            locale={locale}
            isTag={!!node.tagId}
          />
          <div className="calc-tree-text">
            <a
            className="calc-tree-name"
            href={detailUrl}
            title={node.materialId}
            onClick={(e) => { e.preventDefault(); navigate(detailUrl) }}
          >
            <FormattedItemLabel label={label} />
          </a>
          <span className="calc-tree-amount"> x {amountDisplay}</span>
          </div>
        </span>
        {node.tagId && (
          <button
            type="button"
            className="calc-tree-tag-id"
            title={node.tagId}
            onClick={(e) => {
              e.stopPropagation()
              onSelectTag(node.tagId!, e.currentTarget)
            }}
          >
            #
          </button>
        )}
      </div>
      {hasRecipe && node.children.length > 0 && (
        <div className="calc-tree-children">
          {node.children.map((child, index) => (
            <RecipeTreeNode
              key={`${child.materialId}:${index}`}
              node={child}
              bundleId={bundleId}
              baseUrl={baseUrl}
              locale={locale}
              langLabels={langLabels}
              route={route}
              tagItemSelections={tagItemSelections}
              tagFluidSelections={tagFluidSelections}
              onSelectRecipe={onSelectRecipe}
              onClearSelection={onClearSelection}
              onSelectTag={onSelectTag}
              onClearTagSelection={onClearTagSelection}
            />
          ))}
        </div>
      )}
      {hasRecipe && node.byproducts.length > 0 && (
        <div className="calc-tree-children">
          {node.byproducts.map((bp, index) => {
            const bpLabel = resolveLabel(langLabels, bp.id)
            const bpAmount = formatMaterialAmount(bp.kind, bp.amount)
            const bpUrl = buildNavUrl(route, { view: 'item', id: bp.id, lang: locale })
            return (
              <div key={`bp:${bp.id}:${index}`} className="calc-tree-row is-byproduct">
                <span className="calc-tree-recipe-spacer" />
                <MaterialIcon
                  itemId={bp.id}
                  bundleId={bundleId}
                  baseUrl={baseUrl}
                  locale={locale}
                />
        <div className="calc-tree-text" onMouseEnter={handleMouseEnter} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                  <a
                    className="calc-tree-name"
                    href={bpUrl}
                    title={bp.id}
                    onClick={(e) => { e.preventDefault(); navigate(bpUrl) }}
                  >
                    <FormattedItemLabel label={bpLabel} />
                  </a>
                  <span className="calc-tree-amount"> x {bpAmount}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {node.recipe && showTooltip && (
        <RecipeTooltip
          recipeId={node.recipe.recipeId}
          x={tooltipPos.x}
          y={tooltipPos.y}
          visible={showTooltip}
        />
      )}
    </div>
  )
}
