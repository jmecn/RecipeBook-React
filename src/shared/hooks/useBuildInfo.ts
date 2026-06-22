import { useQuery } from '@tanstack/react-query';
import { loadBuildInfo } from '../lib/build-info';

export function useBuildInfo() {
  return useQuery({
    queryKey: ['build-info'],
    queryFn: loadBuildInfo,
    staleTime: Infinity,
  });
}
