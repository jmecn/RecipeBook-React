import { useLocation } from 'react-router-dom';
import { ItemListPage } from '../../features/item-list/ui/ItemListPage';
import { ItemDetailPage } from '../../features/item-detail/ui/ItemDetailPage';
import { RecipeDetailPage } from '../../features/recipe-detail/ui/RecipeDetailPage';
import { TagDetailPage } from '../../features/tag-detail/ui/TagDetailPage';
import { parseLocationQuery } from '../../shared/lib/location-query';

export function QueryRouteView() {
  const location = useLocation();
  const route = parseLocationQuery(location.search);

  if (route.view === 'item') return <ItemDetailPage itemId={route.id ?? ''} />;
  if (route.view === 'tag') return <TagDetailPage tagId={route.id ?? ''} />;
  if (route.view === 'recipe') return <RecipeDetailPage recipeId={route.id ?? ''} />;
  return <ItemListPage />;
}
