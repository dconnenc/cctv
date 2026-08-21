import { useEffect, useRef } from 'react';

import { NewscastersBlock } from '@cctv/types';

import { youtubeEmbedUrl } from './youtube';

import styles from './Newscasters.module.scss';

interface Props {
  block: NewscastersBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function Newscasters({ block, viewContext = 'participant' }: Props) {
  switch (viewContext) {
    case 'monitor':
      return <MonitorView block={block} />;
    case 'manage':
      return <ManageView block={block} />;
    default:
      return <ParticipantView />;
  }
}

function ParticipantView() {
  return (
    <div className={styles.participantRoot}>
      <p className={styles.watchHeading}>Watch the show</p>
    </div>
  );
}

function MonitorView({ block }: { block: NewscastersBlock }) {
  const { playing, restart_count, selected_video } = block.payload;

  if (!selected_video?.url) {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.placeholder}>No video selected</p>
      </div>
    );
  }

  if (selected_video.kind === 'youtube') {
    return (
      <YoutubeMonitor url={selected_video.url} playing={playing} restartCount={restart_count} />
    );
  }

  return <UploadMonitor url={selected_video.url} playing={playing} restartCount={restart_count} />;
}

function UploadMonitor({
  url,
  playing,
  restartCount,
}: {
  url: string;
  playing: boolean;
  restartCount: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.play().catch(() => {
        // Browsers can reject play() without a recent user gesture. The monitor
        // is opened intentionally, so this is expected only during dev reloads.
      });
    } else {
      video.pause();
    }
  }, [playing, url]);

  const prevRestartRef = useRef<number>(restartCount);
  useEffect(() => {
    if (prevRestartRef.current === restartCount) return;
    prevRestartRef.current = restartCount;

    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    if (playing) {
      video.play().catch(() => {});
    }
  }, [restartCount, playing]);

  return (
    <div className={styles.monitorRoot}>
      <video
        ref={videoRef}
        className={styles.media}
        src={url}
        loop
        autoPlay={playing}
        playsInline
      />
    </div>
  );
}

function YoutubeMonitor({
  url,
  playing,
  restartCount,
}: {
  url: string;
  playing: boolean;
  restartCount: number;
}) {
  const embedUrl = youtubeEmbedUrl(url, playing);

  if (!embedUrl) {
    return (
      <div className={styles.monitorRoot}>
        <p className={styles.placeholder}>Invalid video link</p>
      </div>
    );
  }

  // Remounting on playing/restart changes lets the embed reflect play/pause and
  // restart without the YouTube JS API. Best-effort per the block's design.
  return (
    <div className={styles.monitorRoot}>
      <iframe
        key={`${playing}-${restartCount}`}
        className={styles.media}
        src={embedUrl}
        title="Newscasters video"
        allow="autoplay; encrypted-media"
        allowFullScreen
        frameBorder="0"
      />
    </div>
  );
}

function ManageView({ block }: { block: NewscastersBlock }) {
  const { playing, selected_video } = block.payload;

  return (
    <div className={styles.manageSummary}>
      <p>
        Status: <strong>{playing ? 'Playing' : 'Paused'}</strong>
      </p>
      <p>
        Video:{' '}
        <strong>
          {selected_video?.url
            ? selected_video.kind === 'youtube'
              ? 'YouTube link'
              : 'Uploaded video'
            : 'None selected'}
        </strong>
      </p>
    </div>
  );
}
