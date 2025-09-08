export const startGlitchCycle = () => {
  const nextGlitchTime = Math.random() * 40000 + 20000;

  const glitchTimeout = setTimeout(() => {
    const glitchableElements = ['experience-key', 'participants-count', 'players-header'];

    if (participants.length > 0) {
      glitchableElements.push(
        `participant-${participants[Math.floor(Math.random() * participants.length)].id}`,
      );
    }

    const randomElement = glitchableElements[Math.floor(Math.random() * glitchableElements.length)];
    setGlitchingElement(randomElement);

    setTimeout(() => {
      setGlitchingElement(null);
      startGlitchCycle();
    }, 5000);
  }, nextGlitchTime);

  return glitchTimeout;
};
