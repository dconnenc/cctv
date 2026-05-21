import { SOUND_URLS, SoundKey } from './registry';

// Plays a sound effect once. Fire-and-forget; the Audio element is discarded
// when playback ends. Safe to call repeatedly — each call creates its own
// element, so overlapping plays don't cut each other off.
//
// Future: a soundboard feature will need to call this from a websocket
// subscriber on the monitor. Keep this entry point stable.
export function play(key: SoundKey): void {
  const url = SOUND_URLS[key];
  if (!url) return;

  const audio = new Audio(url);
  audio.play().catch(() => {
    // Browsers reject play() if there's no user gesture yet. The monitor is
    // expected to be opened intentionally, but during dev hot-reloads we may
    // hit this — swallow rather than surface.
  });
}
