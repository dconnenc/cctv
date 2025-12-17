import { useMemo } from 'react';

import { Experience } from '@cctv/types';

import styles from './QRCodeDisplay.module.scss';

interface QRCodeDisplayProps {
  experience: Experience;
  compact?: boolean;
}

export default function QRCodeDisplay({ experience, compact = false }: QRCodeDisplayProps) {
  const experienceUrl = useMemo(() => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}/experiences/${experience.code}`;
  }, [experience.code]);

  const qrCode = useMemo(() => {
    const size = compact ? 110 : 220;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      experienceUrl,
    )}`;
  }, [experienceUrl, compact]);

  return (
    <div className={`${styles.root} ${compact ? styles.compact : ''}`}>
      <h2 className={styles.title}>{experience.name}</h2>
      <img src={qrCode} alt={`QR code for joining ${experience.name}`} />
      <p className={styles.code}>Code: {experience.code}</p>
    </div>
  );
}
