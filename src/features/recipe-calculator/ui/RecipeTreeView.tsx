import type { CalcNode } from '../model/types';
import { RecipeTreeNode } from './RecipeTreeNode';

interface RecipeTreeViewProps {
  root: CalcNode;
  bundleId: string;
  baseUrl: string;
  locale: string;
  langLabels: Record<string, string>;
  collapsed: Record<string, boolean>;
  tagItemSelections: Record<string, string>;
  tagFluidSelections: Record<string, string>;
  onSelectRecipe: (materialId: string) => void;
  onCollapse: (materialId: string) => void;
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
  collapsed,
  tagItemSelections,
  tagFluidSelections,
  onSelectRecipe,
  onCollapse,
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
  );
}