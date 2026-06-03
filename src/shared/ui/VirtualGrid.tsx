import { useVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useMemo, type ReactNode } from 'react';
import { chunkIntoRows } from '../lib/grid-rows';

interface VirtualGridProps<T> {
  items: T[];
  columnCount: number;
  rowHeight: number;
  scrollElement: HTMLElement | null;
  enabled?: boolean;
  overscan?: number;
  gap?: number;
  rowClassName?: string;
  rowLayout?: 'grid' | 'flex';
  onRangeChange?: () => void;
  renderCell: (item: T, index: number) => ReactNode;
}

export function VirtualGrid<T>({
  items,
  columnCount,
  rowHeight,
  scrollElement,
  enabled = true,
  overscan = 3,
  gap = 8,
  rowClassName,
  rowLayout = 'grid',
  onRangeChange,
  renderCell,
}: VirtualGridProps<T>) {
  const rows = useMemo(
    () => chunkIntoRows(items, columnCount),
    [items, columnCount],
  );

  const rowVirtualizer = useVirtualizer({
    count: enabled ? rows.length : 0,
    getScrollElement: () => scrollElement,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const rangeKey = virtualItems.length > 0
    ? `${virtualItems[0].index}-${virtualItems[virtualItems.length - 1].index}`
    : '';

  useLayoutEffect(() => {
    if (!enabled || !onRangeChange || !rangeKey) return;
    onRangeChange();
  }, [enabled, onRangeChange, rangeKey]);

  if (!enabled || rows.length === 0) return null;

  return (
    <div
      style={{
        height: rowVirtualizer.getTotalSize(),
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualRow) => {
        const rowItems = rows[virtualRow.index] ?? [];
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div
              className={rowClassName}
              style={
                rowLayout === 'flex'
                  ? {
                    display: 'flex',
                    flexWrap: 'nowrap',
                    gap,
                    alignItems: 'flex-start',
                    width: '100%',
                  }
                  : {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                    gap,
                  }
              }
            >
              {rowItems.map((item, cellIndex) => {
                const globalIndex = virtualRow.index * columnCount + cellIndex;
                const cellKey = typeof item === 'string' || typeof item === 'number'
                  ? String(item)
                  : globalIndex;
                return (
                  <div key={cellKey}>
                    {renderCell(item, globalIndex)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
