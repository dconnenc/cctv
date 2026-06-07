import { useEffect, useRef } from 'react';

import { SOUND_URLS, SoundKey } from './registry';

type ViewContext = 'participant' | 'monitor' | 'manage';

// Plays `key` as a continuous loop while `playing` is true, and pauses it when
// `playing` flips false. Unlike `useMonitorSound` (one-shot, fire-and-forget),
// this owns a single persistent Audio element so playback can be toggled. The
// element is paused and released on unmount. No-op when not on the monitor view
// or when called with an undefined key.
export function useLoopingMonitorSound(
  key: SoundKey | undefined,
  playing: boolean,
  viewContext: ViewContext | undefined,
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

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);
}
