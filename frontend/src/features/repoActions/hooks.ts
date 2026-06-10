import { useMutation } from '@apollo/client/react';
import { useToast } from '@/lib/toast';
import { MARK_SEEN } from './operations';

/**
 * markSeen — advances the watermark and returns the updated Repo; Apollo patches
 * the entity by `id`, so no refetch. Low-friction by design: success is silent,
 * only failures toast. Mirrors the refresh feature's hook shape.
 */
export const useMarkSeen = () => {
  const toast = useToast();
  const [mutate, state] = useMutation(MARK_SEEN);

  const markSeen = async (repoId: string) => {
    try {
      await mutate({ variables: { repoId } });
    } catch {
      toast.error('Could not mark as seen. Try again.');
    }
  };

  return { markSeen, loading: state.loading };
};
