import React from 'react';

import { useExperience } from '@cctv/contexts';
import { useSaveAvatar } from '@cctv/hooks';

import DrawingCanvas from '../DrawingCanvas/DrawingCanvas';

export default function LobbyAvatarEditor({ onFinalize }: { onFinalize?: () => void }) {
  const { participant, experiencePerform } = useExperience();
  const { saveAvatar } = useSaveAvatar();

  const initialImage = participant?.avatar?.image || undefined;
  const initialPosition = participant?.avatar?.position || undefined;

  return (
    <DrawingCanvas
      initialImage={initialImage}
      initialPosition={initialPosition}
      onStrokeEvent={(evt) => experiencePerform?.('drawing_event', evt as any, 'participant')}
      onPositionDrag={(pos) =>
        experiencePerform?.('avatar_position', { position: pos }, 'participant')
      }
      onSaveDrawing={async (uri) => {
        if (!participant?.id) return;
        await saveAvatar({ participantId: participant.id, image: uri });
      }}
      onSavePosition={async (pos) => {
        if (!participant?.id) return;
        await saveAvatar({ participantId: participant.id, position: pos });
      }}
      onFinalize={onFinalize}
    />
  );
}
