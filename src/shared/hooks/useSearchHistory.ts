import { useCallback, useEffect, useState } from 'react';
import { mergeSearchTerm, readSearchHistory, writeSearchHistory } from '../lib/search-history';

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => readSearchHistory());

  useEffect(() => {
    writeSearchHistory(history);
  }, [history]);

  const remember = useCallback((term: string) => {
    setHistory((prev) => mergeSearchTerm(prev, term));
  }, []);

  return { history, remember };
}
