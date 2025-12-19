import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts';
import { Block, BlockKind } from '@cctv/types';

import { DebugParticipant } from './useDebugParticipants';

const RANDOM_WORDS = [
  'apple',
  'banana',
  'cherry',
  'dragon',
  'elephant',
  'falcon',
  'guitar',
  'harmony',
  'island',
  'jungle',
  'kite',
  'lemon',
  'mountain',
  'nebula',
  'ocean',
  'phoenix',
  'quantum',
  'rainbow',
  'sunset',
  'thunder',
  'umbrella',
  'volcano',
  'whisper',
  'xylophone',
  'yellow',
  'zephyr',
];

const RANDOM_NUMBERS = ['42', '17', '99', '256', '1024', '7', '13', '21', '55', '100'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function generatePollResponse(block: Block): { selectedOptions: string[]; submittedAt: string } {
  if (block.kind !== BlockKind.POLL) {
    throw new Error('Block is not a poll');
  }
  const options = block.payload.options || [];
  const pollType = block.payload.pollType || 'single';

  const selectedOptions =
    pollType === 'multiple' ? getRandomElements(options, 1, 3) : [getRandomElement(options)];

  return {
    selectedOptions,
    submittedAt: new Date().toISOString(),
  };
}

function generateQuestionResponse(block: Block): { value: string; submittedAt: string } {
  if (block.kind !== BlockKind.QUESTION) {
    throw new Error('Block is not a question');
  }

  const inputType = block.payload.inputType || 'text';
  let value: string;

  switch (inputType) {
    case 'number':
    case 'tel':
      value = getRandomElement(RANDOM_NUMBERS);
      break;
    case 'email':
      value = `${getRandomElement(RANDOM_WORDS)}@test.local`;
      break;
    default:
      value = getRandomElement(RANDOM_WORDS);
  }

  return {
    value,
    submittedAt: new Date().toISOString(),
  };
}

function generateMultistepFormResponse(block: Block): {
  responses: Record<string, string>;
  submittedAt: string;
} {
  if (block.kind !== BlockKind.MULTISTEP_FORM) {
    throw new Error('Block is not a multistep form');
  }

  const questions = block.payload.questions || [];
  const responses: Record<string, string> = {};

  for (const question of questions) {
    const inputType = question.inputType || 'text';
    let value: string;

    switch (inputType) {
      case 'number':
      case 'tel':
        value = getRandomElement(RANDOM_NUMBERS);
        break;
      case 'email':
        value = `${getRandomElement(RANDOM_WORDS)}@test.local`;
        break;
      default:
        value = getRandomElement(RANDOM_WORDS);
    }

    responses[question.formKey] = value;
  }

  return {
    responses,
    submittedAt: new Date().toISOString(),
  };
}

function getSubmitEndpoint(block: Block): string | null {
  switch (block.kind) {
    case BlockKind.POLL:
      return 'submit_poll_response';
    case BlockKind.QUESTION:
      return 'submit_question_response';
    case BlockKind.MULTISTEP_FORM:
      return 'submit_multistep_form_response';
    case BlockKind.ANNOUNCEMENT:
    case BlockKind.MAD_LIB:
    case BlockKind.FAMILY_FEUD:
      return null;
    default:
      return null;
  }
}

function generateResponse(block: Block): Record<string, any> | null {
  switch (block.kind) {
    case BlockKind.POLL:
      return generatePollResponse(block);
    case BlockKind.QUESTION:
      return generateQuestionResponse(block);
    case BlockKind.MULTISTEP_FORM:
      return generateMultistepFormResponse(block);
    case BlockKind.ANNOUNCEMENT:
    case BlockKind.MAD_LIB:
    case BlockKind.FAMILY_FEUD:
      return null;
    default:
      return null;
  }
}

export interface SimulationProgress {
  total: number;
  completed: number;
  failed: number;
}

export function useSimulateResponses() {
  const { code } = useExperience();
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SimulationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
  });

  const simulateResponses = useCallback(
    async (
      block: Block,
      participants: DebugParticipant[],
      delayMs: number = 100,
    ): Promise<void> => {
      if (!code) {
        setError('Missing experience code');
        return;
      }

      const endpoint = getSubmitEndpoint(block);
      if (!endpoint) {
        setError(`Block type ${block.kind} does not support responses`);
        return;
      }

      // Filter to only participants with JWTs (created debug users)
      const participantsWithJwt = participants.filter((p) => p.jwt);
      if (participantsWithJwt.length === 0) {
        setError('No debug participants with JWTs available. Create debug users first.');
        return;
      }

      // Debug: Check for duplicate user_ids
      const userIds = participantsWithJwt.map((p) => p.user_id);
      const uniqueUserIds = new Set(userIds);
      console.log(
        `[Simulate] Starting simulation for ${participantsWithJwt.length} participants (${uniqueUserIds.size} unique user_ids)`,
      );
      if (uniqueUserIds.size !== participantsWithJwt.length) {
        console.warn('[Simulate] WARNING: Duplicate user_ids detected!', userIds);
      }

      setIsSimulating(true);
      setError(null);
      setProgress({ total: participantsWithJwt.length, completed: 0, failed: 0 });

      const url = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(block.id)}/${endpoint}`;

      for (let i = 0; i < participantsWithJwt.length; i++) {
        const participant = participantsWithJwt[i];
        const answer = generateResponse(block);

        if (!answer) {
          console.warn(`[Simulate] User ${participant.name}: No answer generated`);
          setProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
          continue;
        }

        console.log(
          `[Simulate] Submitting for ${participant.name} (user_id: ${participant.user_id})...`,
        );

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${participant.jwt}`,
            },
            body: JSON.stringify({ answer }),
          });

          if (res.ok) {
            const data = await res.json();
            console.log(`[Simulate] User ${participant.name}: SUCCESS`, data);
            setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
          } else {
            const errorText = await res.text();
            console.error(`[Simulate] User ${participant.name}: FAILED (${res.status})`, errorText);
            setProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
          }
        } catch (e) {
          console.error(`[Simulate] User ${participant.name}: ERROR`, e);
          setProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }

        if (delayMs > 0 && i < participantsWithJwt.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      setIsSimulating(false);
    },
    [code],
  );

  const simulateChildResponses = useCallback(
    async (
      childBlock: Block,
      participants: DebugParticipant[],
      delayMs: number = 100,
    ): Promise<void> => {
      if (!code) {
        setError('Missing experience code');
        return;
      }

      if (childBlock.kind !== BlockKind.QUESTION) {
        setError('Child block must be a question');
        return;
      }

      // Filter to only participants with JWTs (created debug users)
      const participantsWithJwt = participants.filter((p) => p.jwt);
      if (participantsWithJwt.length === 0) {
        setError('No debug participants with JWTs available. Create debug users first.');
        return;
      }

      setIsSimulating(true);
      setError(null);
      setProgress({ total: participantsWithJwt.length, completed: 0, failed: 0 });

      const url = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(childBlock.id)}/submit_question_response`;

      for (let i = 0; i < participantsWithJwt.length; i++) {
        const participant = participantsWithJwt[i];
        const answer = generateQuestionResponse(childBlock);

        console.log(
          `[SimulateChild] Submitting for ${participant.name} (user_id: ${participant.user_id})...`,
        );

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${participant.jwt}`,
            },
            body: JSON.stringify({ answer }),
          });

          if (res.ok) {
            const data = await res.json();
            console.log(`[SimulateChild] User ${participant.name}: SUCCESS`, data);
            setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
          } else {
            const errorText = await res.text();
            console.error(
              `[SimulateChild] User ${participant.name}: FAILED (${res.status})`,
              errorText,
            );
            setProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
          }
        } catch (e) {
          console.error(`[SimulateChild] User ${participant.name}: ERROR`, e);
          setProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }

        if (delayMs > 0 && i < participantsWithJwt.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      setIsSimulating(false);
    },
    [code],
  );

  return {
    simulateResponses,
    simulateChildResponses,
    isSimulating,
    progress,
    error,
    setError,
  };
}
