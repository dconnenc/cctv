import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BlockKind } from '@cctv/types';

import KindPreview from './KindPreview';

describe('KindPreview', () => {
  it.each(Object.values(BlockKind))('renders a preview for %s', (kind) => {
    const { container } = render(<KindPreview kind={kind} />);

    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).not.toBeEmptyDOMElement();
  });

  it('is hidden from assistive technology', () => {
    const { container } = render(<KindPreview kind={BlockKind.POLL} />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies an extra class name when given one', () => {
    const { container } = render(<KindPreview kind={BlockKind.POLL} className="thumb" />);

    expect(container.firstChild).toHaveClass('thumb');
  });
});
