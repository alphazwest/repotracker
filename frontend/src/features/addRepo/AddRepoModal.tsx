import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useToast } from '@/lib/toast';
import { useAddRepo, type RepoPreviewStatus } from './hooks';

interface AddRepoModalProps {
  open: boolean;
  onClose: () => void;
}

interface StatusView {
  ok: boolean;
  label: string;
}

const STATUS_VIEW: Record<RepoPreviewStatus, StatusView> = {
  VALID: { ok: true, label: 'Valid repo' },
  NOT_FOUND: { ok: false, label: 'No repo found for URL' },
  ALREADY_TRACKED: { ok: false, label: 'Repo already tracked' },
  INVALID_URL: { ok: false, label: 'Invalid repo URL' },
};

/**
 * Add-repo modal. The user types a GitHub URL or `owner/name`; once the input
 * matches a repo pattern (`parseRepoInput`) a GitHub icon appears and the check
 * action runs the read-only `previewRepo` query, surfacing a status message at
 * the bottom-left. Add fires the `trackRepo` flow; server errors show inline.
 */
export const AddRepoModal = ({ open, onClose }: AddRepoModalProps) => {
  const toast = useToast();
  const {
    input,
    setInput,
    parsed,
    inputError,
    serverError,
    submitting,
    checking,
    previewStatus,
    checkRepo,
    confirm,
    reset,
  } = useAddRepo();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    const ok = await confirm();
    if (ok) {
      toast.success('Repository added.');
      onClose();
    }
  };

  const status = previewStatus ? STATUS_VIEW[previewStatus] : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="add-repo-title"
    >
      <DialogTitle
        id="add-repo-title"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        Add a repository
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={submitting}
          edge="end"
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="GitHub URL or owner/name"
            placeholder="octocat/Hello-World"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            error={!!inputError}
            helperText={inputError ?? ' '}
            autoFocus
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {parsed ? (
                      <GitHubIcon
                        fontSize="small"
                        color="action"
                        aria-label="github repo"
                        data-testid="add-repo-github-icon"
                        sx={{ mr: 0.5 }}
                      />
                    ) : null}
                    <IconButton
                      aria-label="check repository"
                      onClick={checkRepo}
                      disabled={!parsed || checking}
                      edge="end"
                      size="small"
                    >
                      <SyncIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {serverError ? (
            <Alert severity="error" data-testid="add-repo-error">
              {serverError}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Box sx={{ minHeight: 24, display: 'flex', alignItems: 'center' }}>
          {status ? (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              data-testid="add-repo-status"
              sx={{ color: status.ok ? 'success.main' : 'error.main' }}
            >
              {status.ok ? (
                <CheckCircleIcon fontSize="small" />
              ) : (
                <CancelIcon fontSize="small" />
              )}
              <Typography variant="body2" color="inherit">
                {status.label}
              </Typography>
            </Stack>
          ) : null}
        </Box>
        <Stack direction="row" spacing={1}>
          <Button onClick={handleClose} variant="outlined" disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={!parsed || submitting}
          >
            Add Repository
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
