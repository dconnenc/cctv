import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useUser } from '@cctv/contexts/UserContext';
import { useSaveAvatar } from '@cctv/hooks/useSaveAvatar';
import { AvatarStroke } from '@cctv/types';

import DrawingCanvas from '../DrawingCanvas/DrawingCanvas';

export default function LobbyAvatarEditor({ onFinalize }: { onFinalize?: () => void }) {
  const { participant, experiencePerform } = useExperience();
  const { user } = useUser();
  const { saveAvatar } = useSaveAvatar();

  const initialStrokes = participant?.avatar?.strokes ?? user?.most_recent_avatar?.strokes ?? [];

  return (
    <DrawingCanvas
      initialStrokes={initialStrokes}
      onStrokeEvent={(evt) => experiencePerform?.('drawing_event', evt as Record<string, unknown>)}
      onSubmit={async (strokes: AvatarStroke[]) => {
        if (!participant?.id) return;
        await saveAvatar({ participantId: participant.id, strokes });
        onFinalize?.();
      }}
    />
  );
}
