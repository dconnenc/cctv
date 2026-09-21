import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clearConsoleBuffer, getConsoleLogs, installConsoleBuffer } from './consoleBuffer';

const originalConsole = { ...console };

/** A value JSON.stringify cannot serialize — the case the wrapper must survive. */
class Cycle {
  self: Cycle;

  constructor() {
    this.self = this;
  }
}

beforeEach(() => {
  installConsoleBuffer();
  clearConsoleBuffer();
});

afterEach(() => {
  clearConsoleBuffer();
});

describe('installConsoleBuffer', () => {
  it('records console output with its level', () => {
    console.warn('websocket closed');

    expect(getConsoleLogs()).toEqual([
      expect.objectContaining({ level: 'warn', message: 'websocket closed' }),
    ]);
  });

  it('still forwards to the real console', () => {
    expect(console.log).not.toBe(originalConsole.log);
    expect(() => console.log('passthrough')).not.toThrow();
  });

  it('redacts credentials before they reach the buffer', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.s1gnatur3';

    console.error(`auth failed with ${jwt}`);

    expect(getConsoleLogs()[0].message).not.toContain(jwt);
  });

  it('formats errors readably', () => {
    console.error(new TypeError('boom'));

    expect(getConsoleLogs()[0].message).toBe('TypeError: boom');
  });

  it('serializes objects instead of logging [object Object]', () => {
    console.log({ blockId: 'block-1' });

    expect(getConsoleLogs()[0].message).toBe('{"blockId":"block-1"}');
  });

  it('logs plain strings without JSON quoting', () => {
    console.log('hello');

    expect(getConsoleLogs()[0].message).toBe('hello');
  });

  it('survives circular structures rather than throwing inside the logger', () => {
    const circular = new Cycle();

    expect(() => console.log(circular)).not.toThrow();
    expect(getConsoleLogs()[0].message).toBe('[unserializable]');
  });

  it('keeps only the most recent entries so the buffer stays bounded', () => {
    for (let i = 0; i < 130; i += 1) console.log(`line ${i}`);

    const logs = getConsoleLogs();
    expect(logs).toHaveLength(100);
    expect(logs[logs.length - 1].message).toBe('line 129');
  });
});
