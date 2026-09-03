import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import InfoTooltip from './InfoTooltip';

describe('InfoTooltip', () => {
  it('renders nothing at all when there is no content (never fabricates a reason)', () => {
    const { container } = render(<InfoTooltip label="Why" content="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the tooltip content on hover and hides it on mouse leave', async () => {
    const user = userEvent.setup();
    render(<InfoTooltip label="Why this movie" content="Matches your taste for Sci-Fi." />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Why this movie' }));
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Matches your taste for Sci-Fi.'));

    await user.unhover(screen.getByRole('button', { name: 'Why this movie' }));
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('is reachable via keyboard focus (not hover-only)', async () => {
    const user = userEvent.setup();
    render(<InfoTooltip label="Why this movie" content="Directed by someone you like." />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Why this movie' })).toHaveFocus();
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
  });

  it('shows on click/tap - important for touch devices with no hover', async () => {
    const user = userEvent.setup();
    render(<InfoTooltip label="Why this movie" content="Shares themes with movies you liked." />);

    await user.click(screen.getByRole('button', { name: 'Why this movie' }));
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<InfoTooltip label="Why this movie" content="Some reason." />);

    await user.click(screen.getByRole('button', { name: 'Why this movie' }));
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <InfoTooltip label="Why this movie" content="Some reason." />
        <button type="button">Elsewhere</button>
      </div>
    );

    await user.click(screen.getByRole('button', { name: 'Why this movie' }));
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('does not navigate an ancestor link when clicked (movie cards wrap this in a <Link>)', async () => {
    const user = userEvent.setup();
    let navigated = false;

    render(
      <a href="/movie/1" onClick={() => (navigated = true)}>
        <InfoTooltip label="Why this movie" content="Some reason." />
      </a>
    );

    await user.click(screen.getByRole('button', { name: 'Why this movie' }));

    expect(navigated).toBe(false);
  });
});
