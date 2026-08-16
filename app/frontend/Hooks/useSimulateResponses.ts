import { useCallback, useState } from 'react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
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

interface SimulatedPollAnswer {
  selectedOptions: string[];
  submittedAt: string;
}

interface SimulatedQuestionAnswer {
  value: string;
  submittedAt: string;
}

type SimulatedAnswer = SimulatedPollAnswer | SimulatedQuestionAnswer;

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, arr.length));
}

function generatePollResponse(block: Block): SimulatedPollAnswer {
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

function generateQuestionResponse(block: Block): SimulatedQuestionAnswer {
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

function getSubmitEndpoint(block: Block): string | null {
  switch (block.kind) {
    case BlockKind.POLL:
      return 'submit_poll_response';
    case BlockKind.QUESTION:
      return 'submit_question_response';
    case BlockKind.ANNOUNCEMENT:
    case BlockKind.FAMILY_FEUD:
      return null;
    default:
      return null;
  }
}

function generateResponse(block: Block): SimulatedAnswer | null {
  switch (block.kind) {
    case BlockKind.POLL:
      return generatePollResponse(block);
    case BlockKind.QUESTION:
      return generateQuestionResponse(block);
    case BlockKind.ANNOUNCEMENT:
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

async function submitParticipantsSequentially(
  participants: DebugParticipant[],
  delayMs: number,
  submitOne: (participant: DebugParticipant) => Promise<void>,
): Promise<void> {
  const submitAt = async (index: number): Promise<void> => {
    if (index >= participants.length) return;

    await submitOne(participants[index]);

    if (delayMs > 0 && index < participants.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    await submitAt(index + 1);
  };

  await submitAt(0);
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

      await submitParticipantsSequentially(participantsWithJwt, delayMs, async (participant) => {
        const answer = generateResponse(block);

        if (!answer) {
          console.warn(`[Simulate] User ${participant.name}: No answer generated`);
          setProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
          return;
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
      });

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

      await submitParticipantsSequentially(participantsWithJwt, delayMs, async (participant) => {
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
      });

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
