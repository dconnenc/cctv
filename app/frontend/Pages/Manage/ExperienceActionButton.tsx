import { ReactNode, useMemo } from 'react';

import { Pause, Play } from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core';
import { useExperiencePause } from '@cctv/hooks/useExperiencePause';
import { useExperienceResume } from '@cctv/hooks/useExperienceResume';
import { useExperienceStart } from '@cctv/hooks/useExperienceStart';

interface ActionConfig {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function ExperienceActionButton() {
  const { experience } = useExperience();
  const { startExperience } = useExperienceStart();
  const { pauseExperience } = useExperiencePause();
  const { resumeExperience } = useExperienceResume();

  const config = useMemo<ActionConfig | null>(() => {
    switch (experience?.status) {
      case 'draft':
      case 'lobby':
        return {
          onClick: startExperience,
          icon: <Play size={16} />,
          label: 'Start',
          variant: 'primary',
        };
      case 'live':
        return {
          onClick: pauseExperience,
          icon: <Pause size={16} />,
          label: 'Pause',
          variant: 'secondary',
        };
      case 'paused':
        return {
          onClick: resumeExperience,
          icon: <Play size={16} />,
          label: 'Resume',
          variant: 'primary',
        };
      default:
        return null;
    }
  }, [startExperience, pauseExperience, resumeExperience, experience?.status]);

  if (!config) return null;

  return (
    <Button title={config.label} variant={config.variant} onClick={config.onClick}>
      {config.icon}
      <span>{config.label}</span>
    </Button>
  );
}
