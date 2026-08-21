import { describe, expect, it } from 'vitest';

import { TEMPLATE_NAME_FALLBACK, keyedStrokes, renderNameTemplate } from './utils';

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

describe('keyedStrokes', () => {
  it('returns keyed entries for valid strokes', () => {
    const strokes = [
      { points: [0, 0, 10, 10], color: '#f00', width: 4 },
      { points: [5, 5, 15, 15], color: '#0f0', width: 2 },
    ];
    const result = keyedStrokes(strokes);
    expect(result).toHaveLength(2);
    expect(result[0].stroke).toBe(strokes[0]);
    expect(result[1].stroke).toBe(strokes[1]);
    expect(result[0].key).not.toBe(result[1].key);
  });

  it('assigns distinct keys to duplicate strokes', () => {
    const stroke = { points: [0, 0, 10, 10], color: '#f00', width: 4 };
    const result = keyedStrokes([stroke, stroke]);
    expect(result).toHaveLength(2);
    expect(result[0].key).not.toBe(result[1].key);
  });

  it('filters out strokes with a missing points field', () => {
    const valid = { points: [0, 0, 10, 10], color: '#f00', width: 4 };
    // SAFETY: intentionally omitting `points` to represent corrupt data;
    // the test verifies keyedStrokes drops it without throwing.
    const corrupt = { color: '#00f', width: 2 } as never;
    const result = keyedStrokes([valid, corrupt]);
    expect(result).toHaveLength(1);
    expect(result[0].stroke).toBe(valid);
  });

  it('returns an empty array when all strokes are corrupt', () => {
    // SAFETY: intentionally omitting `points` to represent corrupt data.
    const result = keyedStrokes([{ color: '#f00', width: 4 } as never]);
    expect(result).toHaveLength(0);
  });

  it('returns an empty array for an empty input', () => {
    expect(keyedStrokes([])).toHaveLength(0);
  });
});
