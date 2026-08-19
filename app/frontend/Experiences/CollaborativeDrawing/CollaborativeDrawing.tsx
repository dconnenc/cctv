import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Camera, Check } from 'lucide-react';
import { motion } from 'motion/react';

import { DrawingCanvas, DrawingCanvasSubmission } from '@cctv/components';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { Button } from '@cctv/core';
import {
  useDirectUpload,
  useSubmitCollaborativeDrawing,
  useSubmitCollaborativeDrawingPhoto,
} from '@cctv/hooks';
import { SoundKey, useMonitorSound } from '@cctv/sounds';
import { CollaborativeDrawingBlock, CollaborativeDrawingBoardGroup } from '@cctv/types';

import Avatar from '../GuessWho/Avatar';
import CompositeCanvas from './CompositeCanvas';
import {
  MARKER_SECONDS,
  MONITOR_COUNTDOWN_SECONDS,
  PREVIEW_SECONDS,
  SLICE_DRAW_WIDTH,
  SubPhaseState,
} from './collaborativeDrawingConstants';

import styles from './CollaborativeDrawing.module.scss';

interface CollaborativeDrawingProps {
  block: CollaborativeDrawingBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
  sounds?: Partial<Record<string, SoundKey>>;
}

function useNow(active: boolean, intervalMs = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);
  return now;
}

function computeSubPhase(
  roundStartedAt: string | null,
  drawingTimeSeconds: number,
  endedAt: string | null,
  now: number,
): SubPhaseState {
  if (!roundStartedAt)
    return { subPhase: 'get_ready', drawRemaining: drawingTimeSeconds } satisfies SubPhaseState;
  const elapsed = (now - new Date(roundStartedAt).getTime()) / 1000;
  const drawStart = PREVIEW_SECONDS + MARKER_SECONDS;
  const drawEnd = drawStart + drawingTimeSeconds;

  if (endedAt || elapsed >= drawEnd)
    return { subPhase: 'times_up', drawRemaining: 0 } satisfies SubPhaseState;
  if (elapsed < PREVIEW_SECONDS)
    return { subPhase: 'preview', drawRemaining: drawingTimeSeconds } satisfies SubPhaseState;
  if (elapsed < drawStart)
    return { subPhase: 'marker', drawRemaining: drawingTimeSeconds } satisfies SubPhaseState;
  return {
    subPhase: 'draw',
    drawRemaining: Math.max(0, Math.ceil(drawEnd - elapsed)),
  } satisfies SubPhaseState;
}

export default function CollaborativeDrawing({
  block,
  viewContext = 'participant',
  sounds,
}: CollaborativeDrawingProps) {
  switch (viewContext) {
    case 'monitor':
      return <MonitorView block={block} sounds={sounds} />;
    case 'manage':
      return <ManageView block={block} />;
    default:
      return <ParticipantView block={block} />;
  }
}

// ---- Participant --------------------------------------------------------

function ParticipantView({ block }: { block: CollaborativeDrawingBlock }) {
  const { phase } = block.payload;
  if (phase === 'round') return <RoundParticipantView block={block} />;
  return <IntakeParticipantView block={block} />;
}

function IntakeParticipantView({ block }: { block: CollaborativeDrawingBlock }) {
  const { prompt } = block.payload;
  const { upload, isUploading, progress } = useDirectUpload();
  const { submitPhoto, isLoading: isSubmitting } = useSubmitCollaborativeDrawingPhoto();
  const { submissionState } = useExperienceState();
  const [signedId, setSignedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submission = submissionState[block.id];
  const hasResponded = !!submission?.photo_url;

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      setPreviewUrl(URL.createObjectURL(file));
      try {
        const result = await upload(file);
        setSignedId(result.signedId);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Upload failed');
        setPreviewUrl(null);
      }
    },
    [upload],
  );

  const handleSubmit = useCallback(async () => {
    if (!signedId) return;
    setError(null);
    const result = await submitPhoto({ blockId: block.id, photoSignedId: signedId });
    if (result && !result.success) setError(result.error || 'Submission failed');
  }, [block.id, signedId, submitPhoto]);

  if (hasResponded) {
    return (
      <div className={styles.container}>
        <p className={styles.prompt}>{prompt}</p>
        <div className={styles.submitted}>
          <div className={styles.successBadge}>
            <Check size={16} />
            <span>Photo submitted</span>
          </div>
          {submission?.photo_url && (
            <img
              src={submission.photo_url}
              alt="Your submission"
              className={styles.submittedPhoto}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.prompt}>{prompt}</p>
      {error && <div className={styles.error}>{error}</div>}

      {previewUrl ? (
        <div className={styles.previewWrapper}>
          <img src={previewUrl} alt="Preview" className={styles.preview} />
          {isUploading && (
            <div className={styles.progressOverlay}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      ) : (
        <button
          className={styles.uploadArea}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera size={32} />
          <span>Tap to select a photo</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />

      {signedId && !isUploading && (
        <Button onClick={handleSubmit} loading={isSubmitting} loadingText="Submitting...">
          Submit Photo
        </Button>
      )}
    </div>
  );
}

function RoundParticipantView({ block }: { block: CollaborativeDrawingBlock }) {
  const { round_started_at, ended_at, drawing_time_seconds } = block.payload;
  const { submissionState } = useExperienceState();
  const { submitDrawing } = useSubmitCollaborativeDrawing();
  const state = submissionState[block.id];
  const assignment = state?.assignment;
  const alreadySubmitted = !!state?.submitted;

  const active = !!round_started_at && !ended_at;
  const now = useNow(active);
  const { subPhase, drawRemaining } = computeSubPhase(
    round_started_at,
    drawing_time_seconds,
    ended_at,
    now,
  );

  const [submitSignal, setSubmitSignal] = useState(0);
  const submittedRef = useRef(false);

  const handleSubmit = useCallback(
    (submission: DrawingCanvasSubmission) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      void submitDrawing({ blockId: block.id, image: submission.image });
    },
    [block.id, submitDrawing],
  );

  // Auto-dispatch whatever is on the canvas the moment the draw window ends.
  useEffect(() => {
    if (subPhase === 'times_up' && !submittedRef.current) {
      setSubmitSignal((s) => s + 1);
    }
  }, [subPhase]);

  // Ended → show this participant's group composite.
  if (ended_at && block.payload.composites) {
    const mine = block.payload.composites.find((c) => c.group_index === assignment?.group_index);
    return (
      <div className={styles.container}>
        <p className={styles.resultTitle}>Your group's masterpiece</p>
        {mine ? (
          <div className={styles.compositeFrame}>
            <CompositeCanvas composite={mine} width={280} />
          </div>
        ) : (
          <p className={styles.waiting}>You sat this one out — enjoy the show!</p>
        )}
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className={styles.container}>
        <p className={styles.waiting}>Get ready…</p>
      </div>
    );
  }

  if (alreadySubmitted || subPhase === 'times_up') {
    return (
      <div className={styles.container}>
        <div className={styles.successBadge}>
          <Check size={16} />
          <span>Drawing submitted</span>
        </div>
        <p className={styles.waiting}>Hold tight while everyone finishes…</p>
      </div>
    );
  }

  if (subPhase === 'get_ready') {
    return (
      <div className={styles.container}>
        <p className={styles.waiting}>Get ready…</p>
      </div>
    );
  }

  if (subPhase === 'preview' || subPhase === 'marker') {
    return <SlicePreview assignment={assignment} showMarker={subPhase === 'marker'} />;
  }

  // subPhase === 'draw'
  return (
    <DrawSlice drawRemaining={drawRemaining} submitSignal={submitSignal} onSubmit={handleSubmit} />
  );
}

function SlicePreview({
  assignment,
  showMarker,
}: {
  assignment: NonNullable<
    ReturnType<typeof useExperienceState>['submissionState'][string]
  >['assignment'];
  showMarker: boolean;
}) {
  if (!assignment) return null;
  const bandPct = 100 / assignment.slice_count;
  const topPct = assignment.slice_index * bandPct;

  return (
    <div className={styles.container}>
      <p className={styles.previewCaption}>
        {showMarker ? 'Remember your section!' : 'Memorize this image!'}
      </p>
      <div className={styles.previewImageFrame}>
        {assignment.source_photo_url && (
          <img src={assignment.source_photo_url} alt="Memorize" className={styles.previewImage} />
        )}
        {showMarker && (
          <motion.div
            className={styles.sliceMarker}
            style={{ top: `${topPct}%`, height: `${bandPct}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className={styles.sliceMarkerLabel}>Your section</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const SLICE_DRAW_SIZE = { w: SLICE_DRAW_WIDTH, h: SLICE_DRAW_WIDTH };

function DrawSlice({
  drawRemaining,
  submitSignal,
  onSubmit,
}: {
  drawRemaining: number;
  submitSignal: number;
  onSubmit: (submission: DrawingCanvasSubmission) => void;
}) {
  return (
    <motion.div
      className={styles.drawOverlay}
      initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      <div className={styles.drawHeader}>
        <span className={styles.drawTimer}>{drawRemaining}s</span>
        <span className={styles.drawHint}>Recreate your section from memory</span>
      </div>
      <DrawingCanvas drawSize={SLICE_DRAW_SIZE} submitSignal={submitSignal} onSubmit={onSubmit} />
    </motion.div>
  );
}

// One column per group (team); avatars stacked in slice order, greyed until
// the participant submits their slice.
function TeamBoard({ board }: { board: CollaborativeDrawingBoardGroup[] }) {
  if (board.length === 0) return null;

  return (
    <div className={styles.teamBoard}>
      {board.map((group) => (
        <div key={group.group_index} className={styles.teamColumn}>
          <p className={styles.teamLabel}>Team {group.group_index + 1}</p>
          {group.slices.map((slice) => (
            <div
              key={slice.slice_index}
              className={`${styles.teamMember} ${slice.submitted ? '' : styles.teamMemberPending}`}
            >
              <Avatar avatar={slice.avatar} size={72} />
              <span className={styles.teamMemberName}>{slice.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---- Monitor ------------------------------------------------------------

function MonitorView({
  block,
  sounds,
}: {
  block: CollaborativeDrawingBlock;
  sounds?: Partial<Record<string, SoundKey>>;
}) {
  const { phase, prompt, round_started_at, ended_at, composites, drawing_time_seconds, board } =
    block.payload;
  const photoCount = block.responses?.total ?? 0;
  const active = !!round_started_at && !ended_at;
  const now = useNow(active);

  const countdown = useMemo(() => {
    if (!round_started_at) return MONITOR_COUNTDOWN_SECONDS;
    const elapsed = (now - new Date(round_started_at).getTime()) / 1000;
    return Math.max(0, Math.ceil(MONITOR_COUNTDOWN_SECONDS - elapsed));
  }, [round_started_at, now]);

  const { drawRemaining } = computeSubPhase(round_started_at, drawing_time_seconds, ended_at, now);

  useMonitorSound(sounds?.on_countdown, active && countdown > 0, 'monitor');

  if (phase === 'intake') {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.monitorIndicator}>{prompt}</p>
        <p className={styles.monitorSub}>
          {photoCount} photo{photoCount === 1 ? '' : 's'} received
        </p>
      </div>
    );
  }

  if (ended_at && composites) {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.monitorIndicator}>The masterpieces</p>
        <div className={styles.compositeGrid}>
          {composites.map((c) => (
            <div key={c.group_index} className={styles.compositeGridItem}>
              <CompositeCanvas composite={c} width={220} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (round_started_at && countdown > 0) {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.monitorIndicator}>Get ready to draw!</p>
        <p className={styles.monitorCountdown}>{countdown}</p>
      </div>
    );
  }

  if (round_started_at) {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.monitorIndicator}>Drawing on phones…</p>
        <p className={styles.monitorCountdown}>{drawRemaining}s</p>
        <TeamBoard board={board ?? []} />
      </div>
    );
  }

  // Tutorial placeholder — filled out later.
  return (
    <div className={styles.monitorRoot}>
      <p className={styles.monitorIndicator}>Collaborative Drawing</p>
      <p className={styles.monitorSub}>
        Each group redraws one photo, one slice each — then we stitch them together.
      </p>
    </div>
  );
}

// ---- Manage -------------------------------------------------------------

function ManageView({ block }: { block: CollaborativeDrawingBlock }) {
  const {
    phase,
    prompt,
    total_drawings,
    min_subsections,
    max_subsections,
    drawing_time_seconds,
    subsection_count,
    ended_at,
  } = block.payload;
  const photoCount = block.responses?.total ?? 0;
  const assignmentCount = block.responses?.assignment_count ?? 0;
  const submissionCount = block.responses?.submission_count ?? 0;

  const status = phase === 'intake' ? 'collecting photos' : ended_at ? 'ended' : 'round running';

  return (
    <div className={styles.manageRoot}>
      <p className={styles.manageStat}>
        Status: <strong>{status}</strong>
      </p>
      <p className={styles.manageStat}>Prompt: {prompt}</p>
      <p className={styles.manageStat}>
        {total_drawings} drawings • {min_subsections}–{max_subsections} slices
        {subsection_count ? ` (using ${subsection_count})` : ''} • {drawing_time_seconds}s to draw
      </p>
      <p className={styles.manageStat}>
        Photos: {photoCount}
        {phase === 'round' && (
          <>
            {' '}
            • Assignments: {assignmentCount} • Submitted: {submissionCount}
          </>
        )}
      </p>
    </div>
  );
}
