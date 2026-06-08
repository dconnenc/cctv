import { describe, expect, it } from 'vitest';

import { extractCodeFromQr } from './join';

describe('extractCodeFromQr', () => {
  it('extracts the code from a full URL with a scheme', () => {
    expect(extractCodeFromQr('https://chicagocomedy.tv/experiences/cam-test-7')).toBe('CAM-TEST-7');
  });

  it('extracts the code from a schemeless URL (the monitor QR regression)', () => {
    expect(extractCodeFromQr('chicagocomedy.tv/experiences/cam-test-7')).toBe('CAM-TEST-7');
  });

  it('extracts the code from a relative path', () => {
    expect(extractCodeFromQr('/experiences/cam-test-7')).toBe('CAM-TEST-7');
  });

  it('extracts the code from a /code/ path', () => {
    expect(extractCodeFromQr('https://chicagocomedy.tv/code/TEST-CODE')).toBe('TEST-CODE');
  });

  it('ignores trailing path segments after the code', () => {
    expect(extractCodeFromQr('https://chicagocomedy.tv/experiences/cam-test-7/monitor')).toBe(
      'CAM-TEST-7',
    );
  });

  it('extracts the code from a query param', () => {
    expect(extractCodeFromQr('https://chicagocomedy.tv/join?code=abc123')).toBe('ABC123');
  });

  it('falls back to the raw code param when it is not valid percent-encoding', () => {
    expect(extractCodeFromQr('https://shop.example/deals?code=SAVE50%')).toBe('SAVE50%');
  });

  it('returns a bare code unchanged (uppercased)', () => {
    expect(extractCodeFromQr('abc123')).toBe('ABC123');
    expect(extractCodeFromQr('  test-code ')).toBe('TEST-CODE');
  });
});
