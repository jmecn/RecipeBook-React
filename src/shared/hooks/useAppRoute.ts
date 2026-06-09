import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { parseLocationQuery } from '../lib/location-query';

export function useAppRoute() {
  const location = useLocation();
  return useMemo(() => parseLocationQuery(location.search), [location.search]);
}
