import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Camera, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

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

function remainingSeconds(untilElapsed: number, elapsed: number): number {
  return Math.max(0, Math.ceil(untilElapsed - elapsed));
}

// The source photo's natural aspect drives the fitted frame and the slice-band
// canvas so nothing is clipped and the drawing matches its portion.
const DEFAULT_ASPECT = { w: 3, h: 4 };

function useImageAspect(url: string | null | undefined) {
  const [aspect, setAspect] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    setAspect(null);
    if (!url) return;
    let cancelled = false;
    const img = new window.Image();
    img.addEventListener('load', () => {
      if (cancelled) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspect({ w: img.naturalWidth, h: img.naturalHeight });
      }
    });
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);
  return aspect;
}

function computeSubPhase(
  roundStartedAt: string | null,
  drawingTimeSeconds: number,
  endedAt: string | null,
  now: number,
): SubPhaseState {
  if (!roundStartedAt) return { subPhase: 'get_ready', phaseRemaining: 0 } satisfies SubPhaseState;
  const elapsed = (now - new Date(roundStartedAt).getTime()) / 1000;
  const drawStart = PREVIEW_SECONDS + MARKER_SECONDS;
  const drawEnd = drawStart + drawingTimeSeconds;

  if (endedAt || elapsed >= drawEnd)
    return { subPhase: 'times_up', phaseRemaining: 0 } satisfies SubPhaseState;
  if (elapsed < PREVIEW_SECONDS)
    return {
      subPhase: 'preview',
      phaseRemaining: remainingSeconds(PREVIEW_SECONDS, elapsed),
    } satisfies SubPhaseState;
  if (elapsed < drawStart)
    return {
      subPhase: 'marker',
      phaseRemaining: remainingSeconds(drawStart, elapsed),
    } satisfies SubPhaseState;
  return {
    subPhase: 'draw',
    phaseRemaining: remainingSeconds(drawEnd, elapsed),
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
  const { subPhase, phaseRemaining } = computeSubPhase(
    round_started_at,
    drawing_time_seconds,
    ended_at,
    now,
  );
  // Hooks must run unconditionally, before any early return below.
  const aspect = useImageAspect(assignment?.source_photo_url);

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

  // preview | marker | draw all render the same fitted-image stage so the
  // slice highlight cross-fades into the drawing canvas over the same portion.
  return (
    <SliceStage
      assignment={assignment}
      aspect={aspect ?? DEFAULT_ASPECT}
      subPhase={subPhase}
      secondsLeft={phaseRemaining}
      submitSignal={submitSignal}
      onSubmit={handleSubmit}
    />
  );
}

// Canonical slice drawing width; height derives from the source aspect so the
// canvas matches the participant's band exactly.
const SLICE_CANVAS_WIDTH = 1000;

function SliceStage({
  assignment,
  aspect,
  subPhase,
  secondsLeft,
  submitSignal,
  onSubmit,
}: {
  assignment: NonNullable<
    ReturnType<typeof useExperienceState>['submissionState'][string]
  >['assignment'];
  aspect: { w: number; h: number };
  subPhase: 'preview' | 'marker' | 'draw';
  secondsLeft: number;
  submitSignal: number;
  onSubmit: (submission: DrawingCanvasSubmission) => void;
}) {
  const sliceCount = assignment?.slice_count ?? 1;
  // Canvas coordinate space matches the participant's band, so the drawing
  // scales to its slice and stacks cleanly into the composite.
  const drawSize = useMemo(
    () => ({
      w: SLICE_CANVAS_WIDTH,
      h: Math.max(1, Math.round((SLICE_CANVAS_WIDTH * (aspect.h / aspect.w)) / sliceCount)),
    }),
    [aspect.w, aspect.h, sliceCount],
  );

  if (!assignment) return null;

  const bandPct = 100 / sliceCount;
  const topPct = assignment.slice_index * bandPct;
  const caption =
    subPhase === 'preview'
      ? 'Memorize this image!'
      : subPhase === 'marker'
        ? 'This is your section!'
        : 'Draw your section from memory';

  return (
    <div className={styles.container}>
      <p className={styles.previewCaption}>{caption}</p>
      <p className={styles.previewCountdown}>{secondsLeft}s</p>

      <AnimatePresence mode="wait" initial={false}>
        {subPhase === 'draw' ? (
          <motion.div
            key="canvas"
            className={styles.sliceCanvasHost}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
          >
            <DrawingCanvas
              drawSize={drawSize}
              fitContainer
              submitSignal={submitSignal}
              onSubmit={onSubmit}
            />
          </motion.div>
        ) : (
          <motion.div
            key="image"
            className={styles.sliceFrame}
            style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {assignment.source_photo_url && (
              <img
                src={assignment.source_photo_url}
                alt="Your assigned section"
                className={styles.sliceImage}
              />
            )}
            <div
              className={`${styles.sliceMarker} ${subPhase === 'marker' ? styles.sliceMarkerActive : ''}`}
              style={{ top: `${topPct}%`, height: `${bandPct}%` }}
            >
              {subPhase === 'marker' && (
                <span className={styles.sliceMarkerLabel}>Your section</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const {
    phase,
    prompt,
    round_started_at,
    ended_at,
    composites,
    composites_revealed,
    drawing_time_seconds,
    board,
  } = block.payload;
  const photoCount = block.responses?.total ?? 0;
  const active = !!round_started_at && !ended_at;
  const now = useNow(active);

  const countdown = useMemo(() => {
    if (!round_started_at) return MONITOR_COUNTDOWN_SECONDS;
    const elapsed = (now - new Date(round_started_at).getTime()) / 1000;
    return Math.max(0, Math.ceil(MONITOR_COUNTDOWN_SECONDS - elapsed));
  }, [round_started_at, now]);

  const { subPhase, phaseRemaining } = computeSubPhase(
    round_started_at,
    drawing_time_seconds,
    ended_at,
    now,
  );
  const drawRemaining = subPhase === 'draw' ? phaseRemaining : drawing_time_seconds;

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

  if (composites_revealed && composites) {
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
