import { buildPageRange } from '../lib/pagination';

interface ListPagerProps {
  current: number;
  total: number;
  summary?: string;
  onPage: (page: number) => void;
}

export function ListPager({ current, total, summary, onPage }: ListPagerProps) {
  if (total <= 1 && !summary) return null;

  return (
    <nav className="list-pager" aria-label="Pagination">
      {summary ? <span className="list-pager-meta">{summary}</span> : null}
      {total > 1 && buildPageRange(current, total).map((entry, index) => {
        if (entry === '…') {
          return (
            <span key={`gap-${index}`} className="list-pager-ellipsis" aria-hidden="true">
              …
            </span>
          );
        }
        const isCurrent = entry === current;
        return (
          <button
            key={entry}
            type="button"
            className={`list-pager-btn${isCurrent ? ' is-current' : ''}`}
            disabled={isCurrent}
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => onPage(entry)}
          >
            {entry}
          </button>
        );
      })}
    </nav>
  );
}
