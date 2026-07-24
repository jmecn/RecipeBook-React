import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useItemOutputs, useAllRecipeOutputs, useRecipeMetas } from '../model/queries';
import { MaterialIcon } from './MaterialIcon';
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel';
import { resolveLabel } from '../lib/utils';
import { buildTree, flattenTree, countTreeStats } from '../lib/calculator-engine';
import type { CalcRecipe, CalcNode, CalcMaterial, CalcRecipeSummary, CalculatorTarget } from '../model/types';
import { RecipeTreeView } from './RecipeTreeView';

export interface CalcTargetSummary {
  targetItemId: string
  targetAmount: number
  rawMaterials: CalcMaterial[]
  byproducts: CalcMaterial[]
  catalysts: CalcMaterial[]
  recipeCount: number
  maxDepth: number
}

interface CalcTargetTreeProps {
  target: CalculatorTarget
  index: number
  bundleId: string
  baseUrl: string
  locale: string
  langLabels: Record<string, string>
  selections: Record<string, string>
  collapsed: Record<string, boolean>
  tagItemSelections: Record<string, string>
  tagFluidSelections: Record<string, string>
  onSelectRecipe: (materialId: string) => void
  onCollapse: (materialId: string) => void
  onClearSelection: (materialId: string) => void
  onClearTagSelection: (tagId: string) => void
  onSelectTag: (tagId: string, anchorEl: HTMLElement) => void
  onRemoveTarget: (index: number) => void
  onAmountChange: (index: number, amount: number) => void
  onSummaryReady: (summary: CalcTargetSummary) => void
}

export function CalcTargetTree({
  target,
  index,
  bundleId,
  baseUrl,
  locale,
  langLabels,
  selections,
  collapsed,
  tagItemSelections,
  tagFluidSelections,
  onSelectRecipe,
  onCollapse,
  onClearSelection,
  onClearTagSelection,
  onSelectTag,
  onRemoveTarget,
  onAmountChange,
  onSummaryReady,
}: CalcTargetTreeProps) {
  const itemOutputsQuery = useItemOutputs(bundleId, target.itemId);
  const recipeOutputsQuery = useAllRecipeOutputs(bundleId, target.itemId, itemOutputsQuery.data);

  const recipeMetasQuery = useRecipeMetas(bundleId, selections);
  const prevRecipeMetas = useRef<Map<string, CalcRecipe>>(new Map());
  const recipeMetas = recipeMetasQuery.data ?? prevRecipeMetas.current;

  useEffect(() => {
    if (recipeMetasQuery.data) {
      prevRecipeMetas.current = recipeMetasQuery.data;
    }
  }, [recipeMetasQuery.data]);

  const getRecipesForItem = useCallback((materialId: string): CalcRecipeSummary[] => {
    if (materialId === target.itemId) {
      return recipeOutputsQuery.data?.get(materialId) ?? [];
    }
    return [];
  }, [target.itemId, recipeOutputsQuery.data]);

  const root = useMemo((): CalcNode | null => {
    if (!target.itemId || !target.itemId.includes(':') || !bundleId) return null;
    const metaMap = recipeMetas ?? new Map();
    return buildTree(
      { materialId: target.itemId, kind: 'item', amount: target.amount, depth: 0 },
      metaMap,
      getRecipesForItem,
      selections,
      undefined,
      tagItemSelections,
      tagFluidSelections,
    );
  }, [target.itemId, target.amount, bundleId, recipeMetas, getRecipesForItem, selections, tagItemSelections, tagFluidSelections]);

  const summary = useMemo((): CalcTargetSummary | null => {
    if (!root) return null;
    const { rawMaterials, byproducts, catalysts } = flattenTree(root);
    const { recipeCount, maxDepth } = countTreeStats(root);
    return { targetItemId: target.itemId, targetAmount: target.amount, rawMaterials, byproducts, catalysts, recipeCount, maxDepth };
  }, [root, target]);

  const prevSummaryRef = useRef<CalcTargetSummary | null>(null);
  useEffect(() => {
    if (summary && summary !== prevSummaryRef.current) {
      prevSummaryRef.current = summary;
      onSummaryReady(summary);
    }
  }, [summary]);

  const targetLabel = resolveLabel(langLabels, target.itemId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(target.amount));

  useEffect(() => {
    setDraft(String(target.amount));
  }, [target.amount]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n > 0) {
      onAmountChange(index, n);
      setDraft(String(n));
    } else {
      setDraft(String(target.amount));
    }
    setEditing(false);
  };

  if (root) {
    return (
      <div className="calc-tree-column">
        <div className="calc-tree-column-header">
          <MaterialIcon
            itemId={target.itemId}
            bundleId={bundleId}
            baseUrl={baseUrl}
            locale={locale}
            className="calc-tree-column-icon"
          />
          <div className="calc-tree-column-name" title={target.itemId}>
            <FormattedItemLabel label={targetLabel} />
          </div>
          <button
            type="button"
            className="calc-tree-column-remove"
            title="Remove target"
            onClick={() => onRemoveTarget(index)}
          >
            ×
          </button>
          <input
            className="calc-tree-column-amount"
            type="number"
            min="1"
            value={editing ? draft : target.amount}
            onFocus={() => { setEditing(true); setDraft(String(target.amount)); }}
            onBlur={commit}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(String(target.amount)); setEditing(false); }
            }}
          />
        </div>
        <div className="calc-tree-column-body">
          <RecipeTreeView
            root={root}
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
        </div>
      </div>
    );
  }

  return <p className="app-empty">Loading...</p>;
}
