import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  BlockKind,
  CollaborativeDrawingBlock,
  CollaborativeDrawingComposite,
  SubmissionState,
} from '@cctv/types';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import { lobbyExperience, mockParticipant } from '../../../../.storybook/fixtures';
import CollaborativeDrawing from './CollaborativeDrawing';

const BLOCK_ID = 'collab-draw-1';

const PLACEHOLDER_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">
       <rect width="300" height="400" fill="#1b1b1b"/>
       <circle cx="150" cy="150" r="70" fill="#3a3a3a"/>
       <rect x="60" y="250" width="180" height="110" rx="12" fill="#2a2a2a"/>
     </svg>`,
  );

const sliceImage = (fill: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
       <rect width="300" height="300" fill="${fill}"/>
       <line x1="20" y1="20" x2="280" y2="280" stroke="#39ff14" stroke-width="8"/>
     </svg>`,
  );

const composite = (groupIndex: number): CollaborativeDrawingComposite => ({
  group_index: groupIndex,
  slice_count: 3,
  source_photo_url: PLACEHOLDER_PHOTO,
  slices: [
    { slice_index: 0, image: sliceImage('#202020'), name: 'Alice' },
    { slice_index: 1, image: sliceImage('#282828'), name: 'Bob' },
    { slice_index: 2, image: sliceImage('#303030'), name: 'Charlie' },
  ],
});

function build(
  overrides: Partial<CollaborativeDrawingBlock['payload']> = {},
): CollaborativeDrawingBlock {
  return {
    id: BLOCK_ID,
    kind: BlockKind.COLLABORATIVE_DRAWING,
    status: 'open',
    position: 0,
    payload: {
      prompt: 'Submit a photo of your pet',
      min_subsections: 3,
      max_subsections: 6,
      drawing_time_seconds: 60,
      total_drawings: 4,
      phase: 'intake',
      subsection_count: null,
      pool: [],
      preview_started_at: null,
      round_started_at: null,
      ended_at: null,
      composites: null,
      ...overrides,
    },
    responses: { total: 12, assignment_count: 9, submission_count: 5 },
  };
}

const assignmentState = (): SubmissionState => ({
  [BLOCK_ID]: {
    assignment: {
      group_index: 0,
      slice_index: 1,
      slice_count: 3,
      source_photo_url: PLACEHOLDER_PHOTO,
    },
    image: null,
    submitted: false,
  },
});

const isoSecondsAgo = (s: number) => new Date(Date.now() - s * 1000).toISOString();

const meta: Meta<typeof CollaborativeDrawing> = {
  title: 'Experiences/CollaborativeDrawing',
  component: CollaborativeDrawing,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof CollaborativeDrawing>;

function seeded(
  block: CollaborativeDrawingBlock,
  viewContext: 'participant' | 'monitor' | 'manage',
  submissionState?: SubmissionState,
): Story {
  return {
    args: { block, viewContext },
    decorators: [
      (StoryFn) => (
        <ExperienceSeeder
          experience={lobbyExperience}
          participant={mockParticipant}
          submissionState={submissionState}
        >
          <StoryFn />
        </ExperienceSeeder>
      ),
    ],
  };
}

// ---- Intake ----
export const IntakeParticipant = seeded(build(), 'participant');
export const IntakeMonitor = seeded(build(), 'monitor');
export const ManageIntake = seeded(build(), 'manage');

// ---- Round (participant sub-phases, anchored to round_started_at) ----
export const RoundPreview = seeded(
  build({ phase: 'round', subsection_count: 3, round_started_at: isoSecondsAgo(1) }),
  'participant',
  assignmentState(),
);

export const RoundMarker = seeded(
  build({ phase: 'round', subsection_count: 3, round_started_at: isoSecondsAgo(11) }),
  'participant',
  assignmentState(),
);

export const RoundDraw = seeded(
  build({ phase: 'round', subsection_count: 3, round_started_at: isoSecondsAgo(14) }),
  'participant',
  assignmentState(),
);

// ---- Monitor round states ----
export const MonitorCountdown = seeded(
  build({ phase: 'round', subsection_count: 3, round_started_at: isoSecondsAgo(3) }),
  'monitor',
);

export const MonitorDrawing = seeded(
  build({ phase: 'round', subsection_count: 3, round_started_at: isoSecondsAgo(12) }),
  'monitor',
);

// ---- Composite reveal ----
const endedBlock = build({
  phase: 'round',
  subsection_count: 3,
  round_started_at: isoSecondsAgo(80),
  ended_at: isoSecondsAgo(1),
  composites: [composite(0), composite(1)],
});

export const ParticipantComposite = seeded(endedBlock, 'participant', assignmentState());
export const MonitorComposites = seeded(endedBlock, 'monitor');
export const ManageEnded = seeded(endedBlock, 'manage');
