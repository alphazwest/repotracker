import { useMutation } from '@apollo/client/react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { TRACKED_REPOS } from '@/lib/apollo/operations/repos';
import { useToast } from '@/lib/toast';
import { UNTRACK_REPO } from './operations';

interface ConfirmRemoveDialogProps {
  open: boolean;
  repoId: string | null;
  repoLabel?: string | undefined;
  onClose: () => void;
}

/**
 * Confirmation dialog for removing a tracked repo. Removal changes list
 * membership, so untrackRepo refetches the list.
 */
export const ConfirmRemoveDialog = ({
  open,
  repoId,
  repoLabel,
  onClose,
}: ConfirmRemoveDialogProps) => {
  const toast = useToast();
  const [untrack, { loading }] = useMutation(UNTRACK_REPO, {
    refetchQueries: [TRACKED_REPOS],
  });

  const handleConfirm = async () => {
    if (!repoId) {
      return;
    }
    try {
      await untrack({ variables: { repoId } });
      toast.success('Repository removed.');
      onClose();
    } catch {
      toast.error('Could not remove the repository. Try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="remove-repo-title">
      <DialogTitle id="remove-repo-title">Remove repository?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {repoLabel
            ? `Stop tracking ${repoLabel}? You can add it again later.`
            : 'Stop tracking this repository? You can add it again later.'}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="error" disabled={loading}>
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  );
};
