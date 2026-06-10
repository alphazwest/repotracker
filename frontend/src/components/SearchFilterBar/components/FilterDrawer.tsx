import { useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { FilterCombinator, FilterCondition } from '@/types';
import { EMPTY_FILTER_MODEL, makeCondition, type FilterDrawerProps } from '../types';
import { ConditionRow } from './ConditionRow';

const DRAWER_WIDTH = 420;

/**
 * Right-hand filter builder. A combinator toggle (Match ALL / Match ANY) plus a
 * list of condition rows over all repo fields. Edits accumulate in a local
 * draft — nothing filters until "Apply" commits it; the draft re-syncs to the
 * applied filter each time the drawer opens. "Clear all" empties the draft.
 */
export const FilterDrawer = ({
  open,
  onClose,
  value,
  onChange,
  resultCount,
}: FilterDrawerProps) => {
  const [draft, setDraft] = useState(value);

  // Re-sync the draft to the applied filter whenever the drawer opens; edits
  // below mutate the draft only, so the list is untouched until "Apply".
  useEffect(() => {
    if (open) {
      setDraft(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setCombinator = (combinator: FilterCombinator) =>
    setDraft((d) => ({ ...d, combinator }));

  const addCondition = () =>
    setDraft((d) => ({ ...d, conditions: [...d.conditions, makeCondition()] }));

  const updateCondition = (index: number, next: FilterCondition) =>
    setDraft((d) => ({
      ...d,
      conditions: d.conditions.map((c, i) => (i === index ? next : c)),
    }));

  const removeCondition = (index: number) =>
    setDraft((d) => ({
      ...d,
      conditions: d.conditions.filter((_, i) => i !== index),
    }));

  const clearAll = () => setDraft(EMPTY_FILTER_MODEL);
  const apply = () => onChange(draft);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: DRAWER_WIDTH } } } }}
      data-testid="filter-drawer"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Filters
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              onClick={clearAll}
              disabled={draft.conditions.length === 0}
            >
              Clear all
            </Button>
            <IconButton aria-label="close filters" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
        <Divider />

        <Box sx={{ px: 2.5, py: 2, flex: 1, overflowY: 'auto' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={draft.combinator}
            onChange={(_e, next: FilterCombinator | null) => {
              if (next) {
                setCombinator(next);
              }
            }}
            aria-label="match combinator"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="AND" aria-label="match all">
              Match ALL
            </ToggleButton>
            <ToggleButton value="OR" aria-label="match any">
              Match ANY
            </ToggleButton>
          </ToggleButtonGroup>

          {draft.conditions.map((condition, index) => (
            // 1rem bottom margin separates each field/operator/value group.
            <Box key={condition.id} sx={{ mb: '1rem' }}>
              <ConditionRow
                condition={condition}
                index={index}
                onChange={(next) => updateCondition(index, next)}
                onRemove={() => removeCondition(index)}
              />
            </Box>
          ))}
          {draft.conditions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No conditions yet. Add one to narrow the list.
            </Typography>
          ) : null}

          <Button
            startIcon={<AddIcon />}
            onClick={addCondition}
            sx={{ mt: 1 }}
            aria-label="add condition"
          >
            Add condition
          </Button>
        </Box>

        <Divider />
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Showing{' '}
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {resultCount}
            </Box>{' '}
            {resultCount === 1 ? 'repository' : 'repositories'}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={apply}
            data-testid="apply-filters"
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
