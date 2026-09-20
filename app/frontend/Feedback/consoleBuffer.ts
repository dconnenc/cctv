import { redact } from './redact';

export interface ConsoleEntry {
  level: ConsoleLevel;
  at: string;
  message: string;
}

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const CAPTURED_LEVELS: ConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug'];
const MAX_ENTRIES = 100;
const MAX_MESSAGE_LENGTH = 2000;

const buffer: ConsoleEntry[] = [];
let installed = false;

/**
 * Wraps console so the last few entries are available when someone reports a
 * bug. Installed once at boot rather than when the panel opens, because the
 * interesting output has already scrolled past by the time a user decides to
 * complain.
 */
export function installConsoleBuffer(): void {
  if (installed || !('window' in globalThis)) return;
  installed = true;

  for (const level of CAPTURED_LEVELS) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      record(level, formatArgs(args));
      original(...args);
    };
  }

  window.addEventListener('error', (event) => {
    record('error', `Uncaught: ${event.message} (${event.filename}:${event.lineno})`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    record('error', `Unhandled rejection: ${formatArgs([event.reason])}`);
  });
}

export function getConsoleLogs(): ConsoleEntry[] {
  return [...buffer];
}

export function clearConsoleBuffer(): void {
  buffer.length = 0;
}

function record(level: ConsoleLevel, message: string): void {
  if (!message) return;

  buffer.push({
    level,
    at: new Date().toISOString(),
    message: redact(message).slice(0, MAX_MESSAGE_LENGTH),
  });

  if (buffer.length > MAX_ENTRIES) buffer.shift();
}

const JSON_STRING = /^"([\s\S]*)"$/;

/**
 * Console arguments are an I/O boundary: callers pass anything, including
 * circular structures and live DOM nodes. Each value is decoded to a log line
 * here, and a serialization failure degrades rather than throwing inside the
 * wrapper that is doing the logging.
 */
function formatArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;

      try {
        const serialized = JSON.stringify(arg);
        if (serialized === undefined) return String(arg);

        // Strings serialize with surrounding quotes; drop them so a plain
        // console.log('hello') reads as hello rather than "hello".
        return JSON_STRING.exec(serialized)?.[1] ?? serialized;
      } catch {
        return '[unserializable]';
      }
    })
    .join(' ')
    .trim();
}
