import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { fontFamilyMono } from '@/theme';
import type { Repo } from '@/types';
import { releaseHeadline } from '../utils';

interface ReleaseTagProps {
  repo: Repo;
}

/**
 * Inline release headline rendered on the title line: the version as bold mono
 * text in the normal text color (the key metric, readable but not a loud colored
 * block), followed by a muted italic short date. Version stays visually
 * subordinate to the repo title while remaining legible.
 */
export const ReleaseTag = ({ repo }: ReleaseTagProps) => {
  const { version, date } = releaseHeadline(repo);

  return (
    <Box
      data-testid="release-headline"
      sx={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}
    >
      {version ? (
        <Box
          component="span"
          sx={{
            fontFamily: fontFamilyMono,
            fontSize: '0.78rem',
            fontWeight: 700,
            lineHeight: 1.4,
            color: 'text.primary',
            whiteSpace: 'nowrap',
          }}
        >
          {version}
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          No releases yet
        </Typography>
      )}
      {date ? (
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ fontStyle: 'italic' }}
        >
          {date}
        </Typography>
      ) : null}
    </Box>
  );
};
