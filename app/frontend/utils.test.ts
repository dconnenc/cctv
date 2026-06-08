import { describe, expect, it } from 'vitest';

import { TEMPLATE_NAME_FALLBACK, renderNameTemplate } from './utils';

describe('renderNameTemplate', () => {
  it('substitutes the participant name', () => {
    expect(
      renderNameTemplate('Hello {{ participant_name }}', { name: 'Alice', email: 'a@x.com' }),
    ).toBe('Hello Alice');
  });

  it('matches the token regardless of inner whitespace', () => {
    const participant = { name: 'Alice', email: 'a@x.com' };
    expect(renderNameTemplate('{{participant_name}}', participant)).toBe('Alice');
    expect(renderNameTemplate('{{   participant_name   }}', participant)).toBe('Alice');
  });

  it('substitutes every occurrence', () => {
    expect(
      renderNameTemplate('{{ participant_name }} & {{ participant_name }}', {
        name: 'Bob',
        email: 'b@x.com',
      }),
    ).toBe('Bob & Bob');
  });

  it('falls back to email when name is blank', () => {
    expect(renderNameTemplate('Hi {{ participant_name }}', { name: '  ', email: 'b@x.com' })).toBe(
      'Hi b@x.com',
    );
  });

  it('falls back to a generic name when no participant is available', () => {
    expect(renderNameTemplate('Hi {{ participant_name }}')).toBe(`Hi ${TEMPLATE_NAME_FALLBACK}`);
    expect(renderNameTemplate('Hi {{ participant_name }}', null)).toBe(
      `Hi ${TEMPLATE_NAME_FALLBACK}`,
    );
  });

  it('leaves text without tokens unchanged', () => {
    expect(renderNameTemplate('Welcome to the show!', { name: 'Alice', email: 'a@x.com' })).toBe(
      'Welcome to the show!',
    );
  });

  it('returns an empty string for nullish templates', () => {
    expect(renderNameTemplate(null)).toBe('');
    expect(renderNameTemplate(undefined)).toBe('');
  });
});
