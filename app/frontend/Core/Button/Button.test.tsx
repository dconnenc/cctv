import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

const { analyticsMock } = vi.hoisted(() => ({
  analyticsMock: {
    capture: vi.fn(),
    AnalyticsEvent: { ButtonClicked: 'button clicked' },
  },
}));
vi.mock('@cctv/analytics', () => analyticsMock);

beforeEach(() => {
  analyticsMock.capture.mockClear();
});

function renderInRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Button analytics', () => {
  it('reports the visible label so flows can be mapped without bespoke events', async () => {
    renderInRouter(<Button>Start Show</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Start Show' }));

    expect(analyticsMock.capture).toHaveBeenCalledWith('button clicked', {
      label: 'Start Show',
      variant: 'primary',
    });
  });

  it('reports the variant so destructive actions are distinguishable', async () => {
    renderInRouter(<Button variant="destructive">Delete Block</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Delete Block' }));

    expect(analyticsMock.capture).toHaveBeenCalledWith('button clicked', {
      label: 'Delete Block',
      variant: 'destructive',
    });
  });

  it('prefers analyticsLabel when the visible label is dynamic', async () => {
    renderInRouter(<Button analyticsLabel="Open Playbill">Open Playbill (12)</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Open Playbill (12)' }));

    expect(analyticsMock.capture).toHaveBeenCalledWith('button clicked', {
      label: 'Open Playbill',
      variant: 'primary',
    });
  });

  it('stays silent when opted out', async () => {
    renderInRouter(<Button analyticsSilent>Noisy Control</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Noisy Control' }));

    expect(analyticsMock.capture).not.toHaveBeenCalled();
  });

  it('still runs the caller onClick', async () => {
    const onClick = vi.fn();
    renderInRouter(<Button onClick={onClick}>Save</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(analyticsMock.capture).toHaveBeenCalledTimes(1);
  });

  it('tracks link buttons, which are navigation steps in a flow', async () => {
    renderInRouter(<Button to="/join">Join Show</Button>);

    await userEvent.click(screen.getByRole('link', { name: 'Join Show' }));

    expect(analyticsMock.capture).toHaveBeenCalledWith('button clicked', {
      label: 'Join Show',
      variant: 'primary',
    });
  });

  it('does not leak analytics props onto the DOM node', () => {
    renderInRouter(
      <Button analyticsLabel="X" analyticsSilent>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.getAttribute('analyticsLabel')).toBeNull();
    expect(button.getAttribute('analyticssilent')).toBeNull();
  });
});
