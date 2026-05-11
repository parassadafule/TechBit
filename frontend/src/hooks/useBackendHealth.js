import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

async function fetchHealth() {
  const { data } = await api.get('/health', { timeout: 5000 });
  if (data?.status !== 'ok') {
    throw new Error('Unexpected health response');
  }
  return true;
}

/**
 * @param {boolean} [enabled=true] Set false in production when VITE_API_URL is a remote API (see shouldPollLocalBackendHealth).
 */
export function useBackendHealth(enabled = true) {
  return useQuery({
    queryKey: ['backend-health'],
    queryFn: fetchHealth,
    enabled,
    refetchInterval: enabled ? 15_000 : false,
    refetchOnWindowFocus: enabled,
    retry: enabled ? 1 : false,
    retryDelay: 1000,
  });
}
