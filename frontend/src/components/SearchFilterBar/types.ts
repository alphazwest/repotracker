import type {
  FilterCondition,
  FilterField,
  FilterModel,
} from '@/types';
import { defaultOperatorForField } from '@/hooks/repoQuery';

/** Shared pixel height for every control in the toolbar strip. */
export const TOOLBAR_CONTROL_HEIGHT = 36;

export const EMPTY_FILTER_MODEL: FilterModel = {
  combinator: 'AND',
  conditions: [],
};

let conditionSeq = 0;

/** Build a fresh, empty condition row (defaults to a Name/contains text row). */
export const makeCondition = (field: FilterField = 'name'): FilterCondition => {
  conditionSeq += 1;
  return {
    id: `cond-${conditionSeq}`,
    field,
    operator: defaultOperatorForField(field),
    value: '',
  };
};

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  value: FilterModel;
  onChange: (next: FilterModel) => void;
  /** Result count after the live-applied filter (drawer footer). */
  resultCount: number;
}
