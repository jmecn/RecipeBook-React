import { ItemListPage } from '../../features/item-list/ui/ItemListPage';
import { ItemDetailPage } from '../../features/item-detail/ui/ItemDetailPage';
import { RecipeDetailPage } from '../../features/recipe-detail/ui/RecipeDetailPage';
import { TagDetailPage } from '../../features/tag-detail/ui/TagDetailPage';
import { useAppRoute } from '../../shared/hooks/useAppRoute';

export function QueryRouteView() {
  const route = useAppRoute();

  if (route.view === 'item') return <ItemDetailPage itemId={route.id ?? ''} />;
  if (route.view === 'tag') return <TagDetailPage tagId={route.id ?? ''} />;
  if (route.view === 'recipe') return <RecipeDetailPage recipeId={route.id ?? ''} />;
  return <ItemListPage />;
}
