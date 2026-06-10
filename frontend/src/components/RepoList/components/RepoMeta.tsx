import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import { fontFamilyMono } from '@/theme';
import type { Language, Repo } from '@/types';
import { contrastText } from '../utils';
import { TOP_LANGUAGES, LANG_CHIP_FALLBACK_COLOR, chipSx } from '../constants';

interface RepoMetaProps {
  repo: Repo;
}

interface MetricProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

const Metric = ({ icon, value, label }: MetricProps) => (
  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
    {icon}
    <Typography
      component="span"
      aria-label={label}
      sx={{ fontFamily: fontFamilyMono, fontSize: '0.74rem', fontWeight: 600, lineHeight: 1 }}
    >
      {value}
    </Typography>
  </Stack>
);

interface LangChipProps {
  lang: Language;
}

const LangChip = ({ lang }: LangChipProps) => {
  const bg = lang.color ?? LANG_CHIP_FALLBACK_COLOR;
  return (
    <Box
      component="span"
      sx={{
        ...chipSx,
        backgroundColor: bg,
        color: contrastText(lang.color),
      }}
    >
      {lang.name}
    </Box>
  );
};

/** Shared metric-icon size. */
const iconSx = { fontSize: 16 } as const;

/** Stars/watchers/forks rendered as mono numbers (no languages). */
export const RepoMetrics = ({ repo }: RepoMetaProps) => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Metric icon={<StarIcon sx={iconSx} aria-hidden />} value={repo.stars} label="stars" />
      <Metric
        icon={<VisibilityIcon sx={iconSx} aria-hidden />}
        value={repo.watchers}
        label="watchers"
      />
      <Metric
        icon={<ForkRightIcon sx={iconSx} aria-hidden />}
        value={repo.forks}
        label="forks"
      />
    </Stack>
  );

/** Top-3 languages as solid chips, with a "+N" overflow chip. */
export const RepoLanguages = ({ repo }: RepoMetaProps) => {
  const languages = repo.languages ?? [];
  const topLanguages = languages.slice(0, TOP_LANGUAGES);
  const remainder = languages.length - topLanguages.length;
  if (topLanguages.length === 0) {
    return null;
  }
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
      {topLanguages.map((lang) => (
        <LangChip key={lang.name} lang={lang} />
      ))}
      {remainder > 0 ? (
        <Box
          component="span"
          sx={{
            ...chipSx,
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {`+${remainder}`}
        </Box>
      ) : null}
    </Stack>
  );
};
