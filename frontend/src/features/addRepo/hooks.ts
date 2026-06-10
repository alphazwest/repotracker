import { useCallback, useMemo, useState } from 'react';
import { gql, type TypedDocumentNode } from '@apollo/client';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { GITHUB_HOST } from '@/constants';
import type { Repo } from '@/types';
import { REPO_FIELDS } from '@/lib/apollo/operations/fragments';
import { TRACKED_REPOS } from '@/lib/apollo/operations/repos';

/**
 * trackRepo — parse the URL, fetch from GitHub, upsert, link to the user.
 * Returns the new Repo. Changes list membership, so callers refetch the
 * tracked-repos list; the unseen count is derived from it.
 */
export const TRACK_REPO = gql`
  ${REPO_FIELDS}
  mutation TrackRepo($url: String!) {
    trackRepo(url: $url) {
      ...RepoFields
    }
  }
` as TypedDocumentNode<TrackRepoData, TrackRepoVariables>;

export interface TrackRepoVariables {
  url: string;
}

export interface TrackRepoData {
  trackRepo: Repo;
}

/** Status of a read-only repo URL preview. Mirrors the server enum. */
export type RepoPreviewStatus =
  | 'VALID'
  | 'INVALID_URL'
  | 'NOT_FOUND'
  | 'ALREADY_TRACKED';

/**
 * previewRepo — validate a URL without tracking. Read-only; the add modal calls
 * it to confirm a repo exists (and isn't already tracked) before committing.
 */
export const PREVIEW_REPO = gql`
  query PreviewRepo($url: String!) {
    previewRepo(url: $url) {
      status
      owner
      name
    }
  }
` as TypedDocumentNode<PreviewRepoData, PreviewRepoVariables>;

export interface PreviewRepoVariables {
  url: string;
}

export interface RepoPreview {
  status: RepoPreviewStatus;
  owner: string | null;
  name: string | null;
}

export interface PreviewRepoData {
  previewRepo: RepoPreview;
}

export interface ParsedRepo {
  owner: string;
  name: string;
  url: string;
}

/**
 * Parse a GitHub repo URL or `owner/name` shorthand into a normalized
 * `{ owner, name, url }`. Returns null for unparseable input — the source of the
 * inline validation message in the add modal before any network call.
 */
export const parseRepoInput = (raw: string): ParsedRepo | null => {
  const input = raw.trim();
  if (!input) {
    return null;
  }

  let owner: string | undefined;
  let name: string | undefined;

  if (input.includes(GITHUB_HOST)) {
    try {
      const withProtocol = input.startsWith('http') ? input : `https://${input}`;
      const url = new URL(withProtocol);
      if (!url.hostname.endsWith(GITHUB_HOST)) {
        return null;
      }
      const segments = url.pathname.split('/').filter(Boolean);
      [owner, name] = segments;
    } catch {
      return null;
    }
  } else {
    const segments = input.split('/').filter(Boolean);
    if (segments.length === 2) {
      [owner, name] = segments;
    }
  }

  if (!owner || !name) {
    return null;
  }
  const cleanName = name.replace(/\.git$/, '');
  return {
    owner,
    name: cleanName,
    url: `https://github.com/${owner}/${cleanName}`,
  };
};

export interface UseAddRepoResult {
  input: string;
  setInput: (value: string) => void;
  /** Client-side parse of the current input; non-null ⇒ valid GitHub pattern. */
  parsed: ParsedRepo | null;
  inputError: string | null;
  serverError: string | null;
  submitting: boolean;
  /** Whether the read-only preview query is in flight. */
  checking: boolean;
  /**
   * Result of the last `previewRepo` check, or null before any check / after the
   * input changed (stale results are cleared on edit).
   */
  previewStatus: RepoPreviewStatus | null;
  /** Run the read-only preview query against the current parsed URL. */
  checkRepo: () => Promise<void>;
  confirm: () => Promise<boolean>;
  reset: () => void;
}

/**
 * Drives the add-repo flow. `parseRepoInput` is the client-side pattern gate:
 * non-null enables the check and Add actions. `checkRepo` runs the read-only
 * `previewRepo` query (validate without tracking); `confirm` runs `trackRepo`
 * (refetches the list, since membership changes). GitHub/server failures
 * surface as `serverError` for inline display. Editing the input clears any
 * stale preview status.
 */
export const useAddRepo = (onTracked?: () => void): UseAddRepoResult => {
  const [input, setInputState] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<RepoPreviewStatus | null>(
    null,
  );
  const [track, { loading }] = useMutation(TRACK_REPO, {
    refetchQueries: [TRACKED_REPOS],
  });
  const [runPreview, { loading: checking }] = useLazyQuery(PREVIEW_REPO, {
    fetchPolicy: 'network-only',
  });

  const parsed = useMemo(() => parseRepoInput(input), [input]);
  const inputError =
    input.trim().length > 0 && !parsed
      ? 'Enter a GitHub URL or owner/name (e.g. octocat/Hello-World).'
      : null;

  // Editing the input invalidates a prior check result.
  const setInput = useCallback((value: string) => {
    setInputState(value);
    setPreviewStatus(null);
    setServerError(null);
  }, []);

  const reset = useCallback(() => {
    setInputState('');
    setServerError(null);
    setPreviewStatus(null);
  }, []);

  const checkRepo = useCallback(async (): Promise<void> => {
    if (!parsed) {
      return;
    }
    setServerError(null);
    try {
      const { data } = await runPreview({ variables: { url: parsed.url } });
      setPreviewStatus(data?.previewRepo.status ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not check the repository.';
      setServerError(message);
    }
  }, [parsed, runPreview]);

  const confirm = async (): Promise<boolean> => {
    if (!parsed) {
      return false;
    }
    setServerError(null);
    try {
      await track({ variables: { url: parsed.url } });
      reset();
      onTracked?.();
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not add the repository.';
      setServerError(message);
      return false;
    }
  };

  return {
    input,
    setInput,
    parsed,
    inputError,
    serverError,
    submitting: loading,
    checking,
    previewStatus,
    checkRepo,
    confirm,
    reset,
  };
};
