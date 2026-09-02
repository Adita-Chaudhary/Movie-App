import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders 5 radio buttons in interactive mode', () => {
    render(<StarRating value={0} onChange={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('marks the correct star as checked', () => {
    render(<StarRating value={3} onChange={() => {}} />);
    const stars = screen.getAllByRole('radio');
    expect(stars[2]).toHaveAttribute('aria-checked', 'true');
    expect(stars[3]).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the clicked star value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: '4 stars' }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('renders read-only stars without buttons', () => {
    render(<StarRating value={4} readOnly />);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByLabelText('Rated 4 out of 5')).toBeInTheDocument();
  });
});
