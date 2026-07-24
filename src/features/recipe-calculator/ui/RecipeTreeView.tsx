import type { CalcNode } from '../model/types';
import type { AppRoute } from '../../../shared/lib/location-query';
import { RecipeTreeNode } from './RecipeTreeNode';

interface RecipeTreeViewProps {
  root: CalcNode;
  bundleId: string;
  baseUrl: string;
  locale: string;
  langLabels: Record<string, string>;
  route: AppRoute;
  tagItemSelections: Record<string, string>;
  tagFluidSelections: Record<string, string>;
  onSelectRecipe: (materialId: string) => void;
  onClearSelection: (materialId: string) => void;
  onSelectTag: (tagId: string, anchorEl: HTMLElement) => void;
  onClearTagSelection: (tagId: string) => void;
}

export function RecipeTreeView({
  root,
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
}: RecipeTreeViewProps) {
  return (
    <div className="calc-tree">
      <RecipeTreeNode
        node={root}
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
    </div>
  );
}
