import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import flags from '../content/flags'

/** useLiveOps — flag-gated; no live-ops endpoint exists in the backend yet. */
export default function useLiveOps() {
  return useQuery({
    queryKey: ['admin', 'live-ops'],
    queryFn: () => client.get('/admin/live-ops').then((r) => r.data),
    enabled: Boolean(flags.liveOps),
    retry: false,
    refetchInterval: flags.liveOps ? 30_000 : false,
  })
}
