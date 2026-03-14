import {
  Block,
  BlockKind,
  Experience,
  ExperienceParticipant,
  ParticipantSummary,
  PlaybillSection,
} from '../app/frontend/types';

const now = new Date().toISOString();

export const mockParticipants: ExperienceParticipant[] = [
  {
    id: 'p1',
    user_id: 'u1',
    experience_id: 'exp1',
    name: 'Alice',
    email: 'alice@example.com',
    status: 'active',
    role: 'host',
    joined_at: now,
    fingerprint: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p2',
    user_id: 'u2',
    experience_id: 'exp1',
    name: 'Bob',
    email: 'bob@example.com',
    status: 'active',
    role: 'player',
    joined_at: now,
    fingerprint: null,
    created_at: now,
    updated_at: now,
    avatar: {
      strokes: [
        { points: [50, 50, 60, 40, 70, 50], color: '#ff4911', width: 4 },
        { points: [45, 70, 50, 75, 55, 70], color: '#ff4911', width: 3 },
      ],
    },
  },
  {
    id: 'p3',
    user_id: 'u3',
    experience_id: 'exp1',
    name: 'Charlie',
    email: 'charlie@example.com',
    status: 'active',
    role: 'player',
    joined_at: now,
    fingerprint: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p4',
    user_id: 'u4',
    experience_id: 'exp1',
    name: 'Diana',
    email: 'diana@example.com',
    status: 'registered',
    role: 'audience',
    joined_at: null,
    fingerprint: null,
    created_at: now,
    updated_at: now,
  },
];

export const mockParticipant: ParticipantSummary = {
  id: 'p2',
  user_id: 'u2',
  name: 'Bob',
  email: 'bob@example.com',
  role: 'player',
  avatar: {
    strokes: [{ points: [50, 50, 60, 40, 70, 50], color: '#ff4911', width: 4 }],
  },
};

export const mockHostParticipant: ParticipantSummary = {
  id: 'p1',
  user_id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'host',
};

export const mockPollBlock: Block = {
  id: 'block1',
  kind: BlockKind.POLL,
  status: 'open',
  position: 0,
  payload: {
    question: "What's your favorite city?",
    options: ['Chicago', 'New York', 'Los Angeles', 'Austin'],
    pollType: 'single',
  },
  responses: { total: 8, user_responded: false, user_response: null },
};

export const mockQuestionBlock: Block = {
  id: 'block2',
  kind: BlockKind.QUESTION,
  status: 'open',
  position: 1,
  payload: {
    question: 'What brought you here tonight?',
    formKey: 'reason',
    inputType: 'text',
  },
  responses: { total: 5, user_responded: false, user_response: null },
};

export const mockAnnouncementBlock: Block = {
  id: 'block3',
  kind: BlockKind.ANNOUNCEMENT,
  status: 'open',
  position: 2,
  payload: {
    message: 'Welcome to the show, {{ participant_name }}! Get ready for some fun.',
    show_on_monitor: true,
  },
};

export const mockPlaybill: PlaybillSection[] = [
  {
    id: 's1',
    title: 'Welcome',
    body: 'Thank you for joining us for an evening of interactive comedy.',
  },
  {
    id: 's2',
    title: 'The Cast',
    body: 'Tonight featuring our all-star improv ensemble. Audience participation required!',
  },
  {
    id: 's3',
    title: 'After the Show',
    body: 'Join us at the bar for drinks and conversation. Tips appreciated!',
  },
];

export const mockBlocks: Block[] = [mockPollBlock, mockQuestionBlock, mockAnnouncementBlock];

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 'exp1',
    name: 'Friday Night Improv',
    code: 'DEMO',
    code_slug: 'friday-night-improv',
    url: 'http://localhost:3000/experiences/DEMO',
    status: 'lobby',
    description: 'An interactive improv comedy experience',
    creator_id: 'u1',
    hosts: [mockParticipants[0]],
    participants: mockParticipants,
    blocks: mockBlocks,
    playbill_enabled: true,
    playbill: mockPlaybill,
    segments: [
      { id: 'seg1', name: 'Red Team', color: '#ff4911', position: 0 },
      { id: 'seg2', name: 'Blue Team', color: '#3300ff', position: 1 },
    ],
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export const lobbyExperience = makeExperience({ status: 'lobby' });

export const liveExperience = makeExperience({ status: 'live' });

export const pausedExperience = makeExperience({ status: 'paused' });

export const finishedExperience = makeExperience({ status: 'finished' });

export const liveExperienceWithActiveBlock = makeExperience({
  status: 'live',
  blocks: [{ ...mockPollBlock, status: 'open' }],
  participant_block_active: true,
});

export const lobbyExperienceWithBlock = makeExperience({
  status: 'lobby',
  blocks: [{ ...mockAnnouncementBlock, show_in_lobby: true, status: 'open' }],
  participant_block_active: true,
});

export const experienceNoPlaybill = makeExperience({
  playbill_enabled: false,
  playbill: [],
});

export const emptyExperience = makeExperience({
  participants: [mockParticipants[0]],
  blocks: [],
  playbill: [],
  playbill_enabled: false,
});
