import { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckIcon from '@mui/icons-material/Check';
import { SORT_OPTIONS, sortLabel } from '@/hooks/repoQuery';
import type { SortDirection, SortKey, SortState } from '@/types';
import { TOOLBAR_CONTROL_HEIGHT } from '../types';

interface SortControlProps {
  value: SortState;
  onChange: (next: SortState) => void;
}

/**
 * Sort control: a button showing the active key + direction that opens a menu
 * of sortable keys plus an asc/desc toggle. Picking a key keeps the current
 * direction; the asc/desc rows flip it.
 */
export const SortControl = ({ value, onChange }: SortControlProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);

  // Picking a key keeps the menu open so the direction can be set in the same
  // pass; choosing a direction is the terminal action and closes the menu.
  const pickKey = (key: SortKey) => onChange({ ...value, key });
  const pickDirection = (direction: SortDirection) => {
    onChange({ ...value, direction });
    close();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<SwapVertIcon />}
        endIcon={
          value.direction === 'asc' ? (
            <ArrowUpwardIcon fontSize="small" />
          ) : (
            <ArrowDownwardIcon fontSize="small" />
          )
        }
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-haspopup="menu"
        aria-label="sort repositories"
        sx={{
          height: TOOLBAR_CONTROL_HEIGHT,
          flexShrink: 0,
          // Fixed width so the button doesn't resize as the selected sort label
          // changes; fills its cell on mobile.
          width: { xs: '100%', md: 200 },
          justifyContent: 'flex-start',
          borderRadius: '2px',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          color: 'text.primary',
          textTransform: 'none',
          // Right-align the direction arrow when the button has spare width
          // (the full-width mobile sort cell); intrinsic-width desktop is
          // unaffected.
          '& .MuiButton-endIcon': { marginLeft: 'auto' },
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: 'text.secondary',
          },
        }}
      >
        {sortLabel(value.key)}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={close}>
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.key}
            selected={option.key === value.key}
            onClick={() => pickKey(option.key)}
          >
            <ListItemIcon>
              {option.key === value.key ? <CheckIcon fontSize="small" /> : null}
            </ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          selected={value.direction === 'asc'}
          onClick={() => pickDirection('asc')}
        >
          <ListItemIcon>
            <ArrowUpwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ascending</ListItemText>
        </MenuItem>
        <MenuItem
          selected={value.direction === 'desc'}
          onClick={() => pickDirection('desc')}
        >
          <ListItemIcon>
            <ArrowDownwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Descending</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
