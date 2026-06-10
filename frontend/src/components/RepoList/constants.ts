/** Presentational constants shared across the repo list/card components. */

/** Max language chips shown before the rest collapse into a "+N" chip. */
export const TOP_LANGUAGES = 3;

/** Fallback chip background when a language has no GitHub color. */
export const LANG_CHIP_FALLBACK_COLOR = '#6b7280';

/** Shared language-chip geometry/typography; color is layered on per chip. */
export const chipSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  // +2px horizontal and +2px top breathing room over the prior tight chip.
  px: '4px',
  pt: '4px',
  pb: '2px',
  borderRadius: '2px',
  fontSize: '0.62rem',
  fontWeight: 600,
  lineHeight: 1,
} as const;
