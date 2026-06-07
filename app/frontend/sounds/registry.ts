import buzzerErrorUrl from './buzzer_error.mp3';
import familyFeudThemeUrl from './family_feud_theme.mp3';

export type SoundKey = 'buzzer_error' | 'family_feud_theme';

export const SOUND_URLS: Record<SoundKey, string> = {
  buzzer_error: buzzerErrorUrl,
  family_feud_theme: familyFeudThemeUrl,
};
