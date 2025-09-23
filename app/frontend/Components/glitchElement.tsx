import { User } from '@cctv/types';

export const startGlitchCycle = (
  participants: User[],
  setGlitchingElement: (element?: string) => void,
) => {
  const nextGlitchTime = Math.random() * 40000 + 20000;

  const glitchTimeout = setTimeout(() => {
    const glitchableElements = ['experience-key', 'participants-count', 'players-header'];

    if (participants.length > 0) {
      glitchableElements.push(
        `participant-${participants[Math.floor(Math.random() * participants.length)].id}`,
      );
    }

    // Choose random element to glitch
    const randomElement = glitchableElements[Math.floor(Math.random() * glitchableElements.length)];
    setGlitchingElement(randomElement);

    // Remove glitch after 5 seconds and start next cycle
    setTimeout(() => {
      setGlitchingElement(undefined);
      startGlitchCycle(participants, setGlitchingElement);
    }, 5000); // Schedule next glitch
  }, nextGlitchTime);

  return glitchTimeout;
};
