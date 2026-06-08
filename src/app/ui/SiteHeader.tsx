import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocaleSwitch } from '../context/LocaleSwitchContext';
import { useI18n } from '../../shared/i18n/useI18n';
import { buildAppUrl, buildNavUrl, parseLocationQuery, type AppView } from '../../shared/lib/location-query';
import { normalizeLocale } from '../../shared/i18n/locale';
import { siteUrl } from '../../shared/lib/site-base';
import { useBundleMetaQuery, useBundlesManifestQuery } from '../../features/bundle/model/queries';
import { resolveBundleId } from '../../shared/lib/bundle';
import { useTheme } from '../../shared/hooks/useTheme';
import {
  localeDisplayName,
  useLanguageConfig,
  visibleLocales,
} from '../../shared/hooks/useLanguageConfig';

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

const WIKI_URL = 'https://wiki.terrafirmagreg.team/';
const DISCORD_URL = 'https://discord.com/invite/AEaCzCTUwQ';

function filterPlaceholder(view: AppView, filterItems: string, filterDetail: string) {
  return view === 'items' || view === 'tag' ? filterItems : filterDetail;
}

export function SiteHeader() {
  const { locale, t } = useI18n();
  const { setRouteLocale, switchLocale } = useLocaleSwitch();
  const location = useLocation();
  const navigate = useNavigate();
  const route = parseLocationQuery(location.search);
  const bundlesQuery = useBundlesManifestQuery();
  const langConfigQuery = useLanguageConfig();
  const { theme, toggleTheme } = useTheme();

  const bundles = bundlesQuery.data?.bundles ?? [];
  const showBundle = bundles.length > 1;
  const effectiveBundle = resolveBundleId(route.bundleToken, bundlesQuery.data?.default);
  const selectedBundle = effectiveBundle || '_';
  const bundleMetaQuery = useBundleMetaQuery(effectiveBundle);
  const locales = visibleLocales(langConfigQuery.data, bundleMetaQuery.data?.languages);

  useEffect(() => {
    if (!effectiveBundle || bundleMetaQuery.isLoading) return;
    if (locales.length === 0) return;

    const urlLang = route.lang ? normalizeLocale(route.lang) : null;
    if (urlLang && locales.includes(urlLang) && urlLang !== locale) {
      setRouteLocale(urlLang);
      return;
    }
    if (!locales.includes(locale)) {
      setRouteLocale(locales[0]);
    }
  }, [
    effectiveBundle,
    bundleMetaQuery.isLoading,
    locale,
    locales,
    route.lang,
    setRouteLocale,
  ]);

  const goHome = () => {
    navigate(buildNavUrl(route, { view: 'items', id: null, page: 1 }));
  };

  const onSearchChange = (value: string) => {
    navigate(buildAppUrl({
      ...route,
      search: value,
      page: route.view === 'items' || route.view === 'tag' ? 1 : route.page,
    }));
  };

  const showSearch = route.view !== 'recipe';

  return (
    <header className="site-header">
      <div className={`site-header-inner${showSearch ? '' : ' site-header-inner--no-search'}`}>
        <button type="button" className="site-brand" onClick={goHome} title={t('brandTitle')}>
          <img
            className="site-brand-icon"
            src={siteUrl('favicon-32.png')}
            width={28}
            height={28}
            alt=""
            decoding="async"
          />
          <span className="site-name">{t('appTitle')}</span>
        </button>

        {showSearch && (
          <div className="site-search">
            <label className="site-search-field">
              <span className="site-search-icon">
                <SearchIcon />
              </span>
              <input
                type="search"
                className="site-search-input"
                value={route.search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={filterPlaceholder(route.view, t('filterItems'), t('filterDetail'))}
                autoComplete="off"
              />
            </label>
          </div>
        )}

        <div className="site-header-actions">
          <nav className="header-nav-links" aria-label={t('navLinksAria')}>
            <a
              className="header-nav-link"
              href={WIKI_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('navWikiAria')}
            >
              {t('navWiki')}
            </a>
            <a
              className="header-nav-link"
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('navDiscordAria')}
            >
              {t('navDiscord')}
            </a>
          </nav>

          <label className="header-control header-control--locale">
            <span className="header-control-label">{t('labelLang')}</span>
            <select
              className="header-select"
              aria-label="Language"
              value={locale}
              onChange={(e) => void switchLocale(e.target.value)}
            >
              {locales.map((code) => (
                <option value={code} key={code}>
                  {localeDisplayName(langConfigQuery.data, code)}
                </option>
              ))}
            </select>
          </label>

          <label className="header-control header-control--bundle" hidden={!showBundle}>
            <span className="header-control-label">{t('labelBundle')}</span>
            <select
              className="header-select"
              aria-label="Export bundle"
              value={selectedBundle}
              onChange={(e) => {
                const next = e.target.value;
                navigate(buildNavUrl(route, {
                  bundleToken: next === '_' ? '_' : next,
                  view: 'items',
                  id: null,
                  page: 1,
                }));
              }}
            >
              <option value="_">_ (default)</option>
              {bundles.map((bundle) => (
                <option value={bundle} key={bundle}>{bundle}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="header-icon-button"
            aria-label={t('labelTheme')}
            onClick={toggleTheme}
          >
            <span className="header-icon" data-theme-icon="light" hidden={theme !== 'light'}>
              <SunIcon />
            </span>
            <span className="header-icon" data-theme-icon="dark" hidden={theme !== 'dark'}>
              <MoonIcon />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
