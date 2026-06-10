import { useEffect, useRef } from 'react';

import { play } from './play';
import { SoundKey } from './registry';

// Plays `key` once on the rising edge of `when` (falsy -> truthy), in any view
// context. Unlike `useMonitorSound`, this is intended for sounds that play from
// the participant's own device (e.g. their balloon bursting). Browser autoplay
// policies require a prior user gesture — fine on participant screens, which
// are inherently interactive. Safe to call with an undefined key.
export function useSoundEffect(key: SoundKey | undefined, when: boolean): void {
  const previous = useRef(false);

  useEffect(() => {
    const rising = when && !previous.current;
    previous.current = when;

    if (!rising) return;
    if (!key) return;

    play(key);
  }, [key, when]);
}
