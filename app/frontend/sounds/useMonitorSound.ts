import { useEffect, useRef } from 'react';

import { play } from './play';
import { SoundKey } from './registry';

type ViewContext = 'participant' | 'monitor' | 'manage';

// Plays `key` on the rising edge of `when` — i.e. when `when` flips from
// falsy to truthy. No-op when not on the monitor view. Safe to call with an
// undefined key (e.g. when a block doesn't define a sound for the trigger).
export function useMonitorSound(
  key: SoundKey | undefined,
  when: boolean,
  viewContext: ViewContext | undefined,
): void {
  const previous = useRef(false);

  useEffect(() => {
    const rising = when && !previous.current;
    previous.current = when;

    if (!rising) return;
    if (viewContext !== 'monitor') return;
    if (!key) return;

    play(key);
  }, [key, when, viewContext]);
}
