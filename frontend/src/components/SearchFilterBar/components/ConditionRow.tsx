import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  FILTER_FIELDS,
  defaultOperatorForField,
  fieldKind,
  operatorsForField,
} from '@/hooks/repoQuery';
import {
  SYNC_STATUSES,
  type FilterCondition,
  type FilterField,
  type FilterOperator,
} from '@/types';

/** HTML input type per non-enum field kind; anything else is plain text. */
const INPUT_TYPE_BY_KIND: Record<string, 'number' | 'date' | 'text'> = {
  number: 'number',
  date: 'date',
};

/** Default value for enum fields so a freshly chosen field is active immediately. */
const ENUM_DEFAULTS: Record<string, string> = {
  status: 'unseen',
  syncStatus: 'SUCCESS',
};

interface ConditionRowProps {
  condition: FilterCondition;
  index: number;
  onChange: (next: FilterCondition) => void;
  onRemove: () => void;
}

interface ValueInputProps {
  condition: FilterCondition;
  onChange: (next: FilterCondition) => void;
}

const SeenSelect = ({ condition, onChange }: ValueInputProps) => (
  <TextField
    select
    label="Value"
    value={condition.value || 'unseen'}
    onChange={(e) => onChange({ ...condition, value: e.target.value })}
    sx={{ minWidth: 120 }}
    inputProps={{ 'aria-label': 'condition value' }}
  >
    <MenuItem value="unseen">unseen</MenuItem>
    <MenuItem value="seen">seen</MenuItem>
  </TextField>
);

const SyncStatusSelect = ({ condition, onChange }: ValueInputProps) => (
  <TextField
    select
    label="Value"
    value={condition.value || 'SUCCESS'}
    onChange={(e) => onChange({ ...condition, value: e.target.value })}
    sx={{ minWidth: 120 }}
    inputProps={{ 'aria-label': 'condition value' }}
  >
    {SYNC_STATUSES.map((status) => (
      <MenuItem key={status} value={status}>
        {status}
      </MenuItem>
    ))}
  </TextField>
);

/** The value input adapts to the field kind (text / number / date / enum). */
const ValueInput = ({ condition, onChange }: ValueInputProps) => {
  const kind = fieldKind(condition.field);
  if (kind === 'status') {
    return <SeenSelect condition={condition} onChange={onChange} />;
  }
  if (kind === 'syncStatus') {
    return <SyncStatusSelect condition={condition} onChange={onChange} />;
  }
  const inputType = INPUT_TYPE_BY_KIND[kind] ?? 'text';
  return (
    <TextField
      label="Value"
      type={inputType}
      value={condition.value}
      onChange={(e) => onChange({ ...condition, value: e.target.value })}
      sx={{ flex: 1, minWidth: 120 }}
      slotProps={inputType === 'date' ? { inputLabel: { shrink: true } } : undefined}
      inputProps={{ 'aria-label': 'condition value' }}
    />
  );
};

/**
 * One row of the filter builder: Field select + Operator select + value input
 * + remove. Changing the field resets the operator/value to that field's
 * default so the row never holds an operator the new field can't use.
 */
export const ConditionRow = (props: ConditionRowProps) => {
  const { condition, index, onChange, onRemove } = props;
  const operators = operatorsForField(condition.field);

  const handleFieldChange = (field: FilterField) => {
    // Enum fields carry a sensible default value so the condition is active
    // immediately; free-text/number/date start empty (inert until typed).
    const defaultValue = ENUM_DEFAULTS[fieldKind(field)] ?? '';
    onChange({
      ...condition,
      field,
      operator: defaultOperatorForField(field),
      value: defaultValue,
    });
  };

  return (
    <Box
      data-testid="filter-condition"
      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}
    >
      <TextField
        select
        label="Field"
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value as FilterField)}
        sx={{ width: 150 }}
        inputProps={{ 'aria-label': `condition ${index + 1} field` }}
      >
        {FILTER_FIELDS.map((f) => (
          <MenuItem key={f.field} value={f.field}>
            {f.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Operator"
        value={condition.operator}
        onChange={(e) =>
          onChange({ ...condition, operator: e.target.value as FilterOperator })
        }
        sx={{ width: 132 }}
        inputProps={{ 'aria-label': `condition ${index + 1} operator` }}
      >
        {operators.map((op) => (
          <MenuItem key={op.operator} value={op.operator}>
            {op.label}
          </MenuItem>
        ))}
      </TextField>
      <ValueInput condition={condition} onChange={onChange} />
      <Tooltip title="Remove condition">
        <IconButton
          aria-label={`remove condition ${index + 1}`}
          onClick={onRemove}
          sx={{ mt: 0.5 }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
