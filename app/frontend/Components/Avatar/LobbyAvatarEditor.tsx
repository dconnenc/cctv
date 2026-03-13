import { useMemo } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUser } from '@cctv/contexts/UserContext';
import { useSaveAvatar } from '@cctv/hooks/useSaveAvatar';
import { AvatarStroke } from '@cctv/types';

import DrawingCanvas from '../DrawingCanvas/DrawingCanvas';

export default function LobbyAvatarEditor({
  onFinalize,
  onBack,
}: {
  onFinalize?: () => void;
  onBack?: () => void;
}) {
  const { participant, experiencePerform } = useExperience();
  const { user } = useUser();
  const { saveAvatar } = useSaveAvatar();

  const initialStrokes = useMemo(
    () => participant?.avatar?.strokes ?? user?.most_recent_avatar?.strokes ?? [],
    [participant?.avatar, user?.most_recent_avatar],
  );

  return (
    <DrawingCanvas
      initialStrokes={initialStrokes}
      onStrokeEvent={(evt) => experiencePerform?.('drawing_event', evt as Record<string, unknown>)}
      onSubmit={async (strokes: AvatarStroke[]) => {
        if (!participant?.id) return;
        await saveAvatar({ participantId: participant.id, strokes });
        if (!onBack) onFinalize?.();
      }}
      onBack={onBack}
    />
  );
}
