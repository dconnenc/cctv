import { useEffect, useRef } from 'react';

import { SOUND_URLS, SoundKey } from './registry';

type ViewContext = 'participant' | 'monitor' | 'manage';

// Plays `key` as a continuous loop while `playing` is true, and pauses it when
// `playing` flips false. Unlike `useMonitorSound` (one-shot, fire-and-forget),
// this owns a single persistent Audio element so playback can be toggled. The
// element is paused and released on unmount. No-op when not on the monitor view
// or when called with an undefined key.
//
// `restartToken` lets the host restart the track from the beginning: whenever it
// changes the element seeks to 0, and resumes from there only if `playing` is
// true. The first value seen is treated as a baseline and does not trigger a
// restart, so reconnecting to the monitor mid-track does not jump playback.
// Playback never starts on its own — it only begins when `playing` is true.
export function useLoopingMonitorSound(
  key: SoundKey | undefined,
  playing: boolean,
  viewContext: ViewContext | undefined,
  restartToken?: number,
): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (viewContext !== 'monitor' || !key) return;

    if (!audioRef.current) {
      const audio = new Audio(SOUND_URLS[key]);
      audio.loop = true;
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    if (playing) {
      audio.play().catch(() => {
        // Browsers reject play() without a prior user gesture. The monitor is
        // opened intentionally, so this is expected only during dev reloads.
      });
    } else {
      audio.pause();
    }
  }, [key, playing, viewContext]);

  const prevRestartTokenRef = useRef<number | undefined>(restartToken);
  useEffect(() => {
    if (viewContext !== 'monitor' || !key || restartToken === undefined) {
      prevRestartTokenRef.current = restartToken;
      return;
    }
    if (prevRestartTokenRef.current === restartToken) return;
    prevRestartTokenRef.current = restartToken;

    // Only ever start playback when the host has the theme playing. A restart
    // while paused seeks to the beginning but must not unpause the track.
    if (!playing) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }

    if (!audioRef.current) {
      const audio = new Audio(SOUND_URLS[key]);
      audio.loop = true;
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Restart is always triggered by a host action, so a rejection here only
      // happens during dev reloads — same as the toggle effect above.
    });
  }, [restartToken, key, viewContext, playing]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);
}
