import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '@/test/renderWithTheme';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('is hidden at or below one page (<= 10 with pageSize 10)', () => {
    renderWithTheme(
      <Pagination page={1} pageSize={10} totalCount={10} onChange={vi.fn()} />,
    );
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('appears once there are more than 10 repos', () => {
    renderWithTheme(
      <Pagination page={1} pageSize={10} totalCount={11} onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('reports the selected page', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithTheme(
      <Pagination page={1} pageSize={10} totalCount={25} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /go to page 2/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
