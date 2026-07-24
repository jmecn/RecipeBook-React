import type { AppRoute } from '../../../shared/lib/location-query';
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel';
import { ItemCard } from '../../item-list/ui/ItemCard';

export interface TagMemberRow {
  raw: string;
  isItem: boolean;
  id: string;
}

interface TagMemberCardProps {
  member: TagMemberRow;
  label: string;
  baseUrl: string;
  locale: string;
  route: AppRoute;
  isFavorite?: boolean;
  onToggleFavorite?: (itemId: string) => void;
}

export function TagMemberCard({ member, label, baseUrl, locale, route, isFavorite, onToggleFavorite }: TagMemberCardProps) {
  if (member.isItem) {
    return (
      <ItemCard
        itemId={member.id}
        label={label}
        baseUrl={baseUrl}
        locale={locale}
        route={route}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }

  return (
    <article className="item-card item-card--static">
      <div className="item-card-text">
        <FormattedItemLabel label={label} className="item-card-name" />
        <span className="item-card-id">{member.raw}</span>
      </div>
    </article>
  );
}
