import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { bundleBaseUrl } from '../../../shared/api/http';
import { useI18n } from '../../../shared/i18n/useI18n';
import { buildAppUrl } from '../../../shared/lib/location-query';
import { useAppRoute } from '../../../shared/hooks/useAppRoute';
import { creativeTabLabel, useCreativeTabsCatalogQuery } from '../model/creative-tabs';
import { CreativeTabAllIcon, CreativeTabIcon } from './CreativeTabIcon';
import '../../../styles/creative-tab-filter.css';

interface CreativeTabFilterProps {
  bundleId: string;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CreativeTabFilter({ bundleId }: CreativeTabFilterProps) {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const route = useAppRoute();
  const catalogQuery = useCreativeTabsCatalogQuery(bundleId, locale);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const listId = useId();

  const catalog = catalogQuery.data;
  const baseUrl = bundleBaseUrl(bundleId);
  const selected = route.creativeTab ?? '';

  const selectedLabel = useMemo(() => {
    if (!selected) return t('creativeTabAll');
    return creativeTabLabel(catalog, selected);
  }, [catalog, selected, t]);

  const filteredTabs = useMemo(() => {
    if (!catalog?.tabs.length) return [];
    const q = filterText.trim().toLowerCase();
    if (!q) return catalog.tabs;
    return catalog.tabs.filter((tab) => {
      const label = creativeTabLabel(catalog, tab.id).toLowerCase();
      return label.includes(q) || tab.id.toLowerCase().includes(q);
    });
  }, [catalog, filterText]);

  const selectTab = (tabId: string | null) => {
    navigate(buildAppUrl({
      ...route,
      view: 'items',
      creativeTab: tabId,
      page: 1,
    }));
    setOpen(false);
    setFilterText('');
  };

  const closePicker = useCallback(() => {
    setOpen(false);
    setFilterText('');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePicker();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closePicker, open]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('creative-tab-picker-open');
    return () => document.body.classList.remove('creative-tab-picker-open');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!catalog?.tabs.length) {
    return null;
  }

  return (
    <div className="creative-tab-picker">
      <button
        type="button"
        className={`creative-tab-picker-trigger${open ? ' is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        title={selectedLabel}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected ? (
          <CreativeTabIcon
            tabId={selected}
            baseUrl={baseUrl}
            iconsDir={catalog.iconsDir}
            size="sm"
          />
        ) : (
          <CreativeTabAllIcon size="sm" />
        )}
        <span className="creative-tab-picker-trigger-label">{selectedLabel}</span>
        <span className="creative-tab-picker-chevron">
          <ChevronIcon />
        </span>
      </button>

      {open && typeof document !== 'undefined' ? createPortal(
        <>
          <div
            className="creative-tab-picker-backdrop"
            aria-hidden="true"
            onClick={closePicker}
          />
          <div
            className="creative-tab-picker-panel"
            role="dialog"
            aria-modal="true"
          >
            <div className="creative-tab-picker-search">
              <input
                ref={searchRef}
                type="search"
                className="creative-tab-picker-search-input"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="creative-tab-picker-close"
                aria-label="Close"
                onClick={closePicker}
              >
                <CloseIcon />
              </button>
            </div>
            <ul className="creative-tab-picker-list" id={listId} role="listbox">
              <li role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={!selected}
                  className={`creative-tab-picker-option${!selected ? ' is-selected' : ''}`}
                  onClick={() => selectTab(null)}
                >
                  <CreativeTabAllIcon size="md" />
                  <span className="creative-tab-picker-option-label">{t('creativeTabAll')}</span>
                </button>
              </li>
              {filteredTabs.map((tab) => {
                const label = creativeTabLabel(catalog, tab.id);
                const active = tab.id === selected;
                return (
                  <li key={tab.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`creative-tab-picker-option${active ? ' is-selected' : ''}`}
                      title={label}
                      onClick={() => selectTab(tab.id)}
                    >
                      <CreativeTabIcon
                        tabId={tab.id}
                        baseUrl={baseUrl}
                        iconsDir={catalog.iconsDir}
                      />
                      <span className="creative-tab-picker-option-label">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>,
        document.body,
      ) : null}
    </div>
  );
}
