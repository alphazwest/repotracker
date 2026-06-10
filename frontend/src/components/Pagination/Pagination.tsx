import MuiPagination from '@mui/material/Pagination';
import Box from '@mui/material/Box';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onChange: (page: number) => void;
}

/**
 * Bottom pagination control. Engages only past one full page (totalCount >
 * pageSize); at or below the threshold the whole list shows on one page and the
 * control is hidden.
 */
export const Pagination = ({ page, pageSize, totalCount, onChange }: PaginationProps) => {
  const pageCount = Math.ceil(totalCount / pageSize);
  if (pageCount <= 1) {
    return null;
  }

  return (
    <Box
      data-testid="pagination"
      sx={{ display: 'flex', justifyContent: 'center', py: 2 }}
    >
      <MuiPagination
        count={pageCount}
        page={page}
        onChange={(_event, next) => onChange(next)}
        color="primary"
        aria-label="pagination"
      />
    </Box>
  );
};
