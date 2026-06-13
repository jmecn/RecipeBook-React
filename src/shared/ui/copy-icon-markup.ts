const COPY_ICON_HTML = `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="7" y="3" width="10" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 7H4a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 4 18h8a1.5 1.5 0 0 0 1.5-1.5V16" stroke="currentColor" stroke-width="1.5"/></svg>`;

const CHECK_ICON_HTML = `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 10.5 8.2 14 15 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function copyIconMarkup() {
  return COPY_ICON_HTML;
}

export function checkIconMarkup() {
  return CHECK_ICON_HTML;
}
