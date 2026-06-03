import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import { getEmiRendererClient } from '../../../adapters/emi-renderer/client';
import { buildNavUrl, type AppRoute } from '../../../shared/lib/location-query';
import { FormattedItemLabel } from '../../../shared/ui/FormattedItemLabel';

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
}

export function TagMemberCard({ member, label, baseUrl, locale, route }: TagMemberCardProps) {
  const navigate = useNavigate();
  const iconRef = useRef<HTMLDivElement | null>(null);
  const client = useMemo(() => getEmiRendererClient(), []);

  useEffect(() => {
    if (!member.isItem) return;
    const host = iconRef.current;
    if (!host) return;
    const session = client.mountItemIcon(host, { itemId: member.id, baseUrl, locale });
    return () => session.disconnect();
  }, [baseUrl, client, locale, member.id, member.isItem]);

  const body = (
    <>
      {member.isItem && <div className="item-card-icon" ref={iconRef} />}
      <div className="item-card-text">
        <FormattedItemLabel label={label} className="item-card-name" />
        <div className="item-card-id">{member.raw}</div>
      </div>
    </>
  );

  if (!member.isItem) {
    return <article className="item-card item-card--static">{body}</article>;
  }

  const openItem = () => {
    navigate(buildNavUrl(route, { view: 'item', id: member.id, lang: locale }));
  };

  return (
    <article
      className="item-card"
      role="link"
      tabIndex={0}
      onClick={openItem}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openItem();
        }
      }}
    >
      {body}
    </article>
  );
}
