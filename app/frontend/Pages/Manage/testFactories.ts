import {
  AnnouncementBlock,
  Block,
  BlockKind,
  BuzzerBlock,
  Experience,
  ExperienceParticipant,
  FamilyFeudBlock,
  GuessWhoBlock,
  MinigameArithmeticBlock,
  MinigameBalloonPumpBlock,
  PhotoUploadBlock,
  PollBlock,
  QuestionBlock,
  TheSceneBlock,
} from '@cctv/types';

type BlockDefaults = Pick<Block, 'status' | 'position'>;

const blockDefaults: BlockDefaults = { status: 'hidden', position: 0 };

export function pollBlock(overrides: Partial<PollBlock> = {}): PollBlock {
  return {
    ...blockDefaults,
    id: 'block-poll',
    kind: BlockKind.POLL,
    payload: { question: 'Best opener?', options: ['Improv set', 'Stand-up'] },
    ...overrides,
  };
}

export function questionBlock(overrides: Partial<QuestionBlock> = {}): QuestionBlock {
  return {
    ...blockDefaults,
    id: 'block-question',
    kind: BlockKind.QUESTION,
    payload: { question: 'Worst advice you have been given?', formKey: 'worst_advice' },
    ...overrides,
  };
}

export function announcementBlock(overrides: Partial<AnnouncementBlock> = {}): AnnouncementBlock {
  return {
    ...blockDefaults,
    id: 'block-announcement',
    kind: BlockKind.ANNOUNCEMENT,
    payload: { message: 'Phones out.' },
    ...overrides,
  };
}

export function familyFeudBlock(overrides: Partial<FamilyFeudBlock> = {}): FamilyFeudBlock {
  return {
    ...blockDefaults,
    id: 'block-family-feud',
    kind: BlockKind.FAMILY_FEUD,
    payload: { title: 'Name something in a green room' },
    ...overrides,
  };
}

export function photoUploadBlock(overrides: Partial<PhotoUploadBlock> = {}): PhotoUploadBlock {
  return {
    ...blockDefaults,
    id: 'block-photo-upload',
    kind: BlockKind.PHOTO_UPLOAD,
    payload: { prompt: 'Show us your worst headshot' },
    ...overrides,
  };
}

export function buzzerBlock(overrides: Partial<BuzzerBlock> = {}): BuzzerBlock {
  return {
    ...blockDefaults,
    id: 'block-buzzer',
    kind: BlockKind.BUZZER,
    payload: { label: 'Buzz in' },
    ...overrides,
  };
}

export function guessWhoBlock(overrides: Partial<GuessWhoBlock> = {}): GuessWhoBlock {
  return {
    ...blockDefaults,
    id: 'block-guess-who',
    kind: BlockKind.GUESS_WHO,
    payload: { contestants: [], monitor_view: 'idle' },
    ...overrides,
  };
}

export function minigameArithmeticBlock(
  overrides: Partial<MinigameArithmeticBlock> = {},
): MinigameArithmeticBlock {
  return {
    ...blockDefaults,
    id: 'block-minigame-arithmetic',
    kind: BlockKind.MINIGAME_ARITHMETIC,
    payload: {
      variant: 'arithmetic',
      duration_seconds: 60,
      question_count: 10,
      leaderboard_size: 5,
      started_at: null,
      ended_at: null,
    },
    ...overrides,
  };
}

export function minigameBalloonPumpBlock(
  overrides: Partial<MinigameBalloonPumpBlock> = {},
): MinigameBalloonPumpBlock {
  return {
    ...blockDefaults,
    id: 'block-minigame-balloon-pump',
    kind: BlockKind.MINIGAME_BALLOON_PUMP,
    payload: {
      variant: 'balloon_pump',
      target_units: 100,
      started_at: null,
      ended_at: null,
      winner_participant_ids: [],
    },
    ...overrides,
  };
}

export function theSceneBlock(overrides: Partial<TheSceneBlock> = {}): TheSceneBlock {
  return {
    ...blockDefaults,
    id: 'block-the-scene',
    kind: BlockKind.THE_SCENE,
    payload: {
      phase: 'collecting',
      scene_started_at: null,
      winner_revealed_at: null,
      leaderboard_size: 5,
      prompt_input_count: 3,
      performer_participant_ids: [],
      prompt_participant_ids: [],
      buzzer_participant_id: null,
      leaderboard: [],
      performers: [],
    },
    ...overrides,
  };
}

export function blockOfKind(kind: BlockKind): Block {
  switch (kind) {
    case BlockKind.POLL:
      return pollBlock();
    case BlockKind.QUESTION:
      return questionBlock();
    case BlockKind.ANNOUNCEMENT:
      return announcementBlock();
    case BlockKind.FAMILY_FEUD:
      return familyFeudBlock();
    case BlockKind.PHOTO_UPLOAD:
      return photoUploadBlock();
    case BlockKind.BUZZER:
      return buzzerBlock();
    case BlockKind.GUESS_WHO:
      return guessWhoBlock();
    case BlockKind.MINIGAME_ARITHMETIC:
      return minigameArithmeticBlock();
    case BlockKind.MINIGAME_BALLOON_PUMP:
      return minigameBalloonPumpBlock();
    case BlockKind.THE_SCENE:
      return theSceneBlock();
    default: {
      const exhaustiveCheck: never = kind;
      throw new Error(`Unhandled block kind: ${exhaustiveCheck}`);
    }
  }
}

export function participant(overrides: Partial<ExperienceParticipant> = {}): ExperienceParticipant {
  return {
    id: 'participant-1',
    user_id: 'user-1',
    experience_id: 'experience-1',
    name: 'Nina',
    email: 'nina@example.test',
    status: 'registered',
    role: 'audience',
    joined_at: null,
    fingerprint: null,
    created_at: '2026-08-07T00:00:00Z',
    updated_at: '2026-08-07T00:00:00Z',
    ...overrides,
  };
}

export function experience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 'experience-1',
    name: 'Focus Mode Test',
    code: 'FOCUSTEST',
    code_slug: 'focustest',
    url: 'http://localhost:3000/experiences/focustest',
    status: 'lobby',
    creator_id: 'user-1',
    hosts: [],
    participants: [],
    blocks: [],
    segments: [],
    created_at: '2026-08-07T00:00:00Z',
    updated_at: '2026-08-07T00:00:00Z',
    ...overrides,
  };
}
