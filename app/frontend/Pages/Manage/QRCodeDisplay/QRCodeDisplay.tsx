import { useMemo } from 'react';

import { Experience } from '@cctv/types';

import styles from './QRCodeDisplay.module.scss';

interface QRCodeDisplayProps {
  experience: Experience;
}

export default function QRCodeDisplay({ experience }: QRCodeDisplayProps) {
  const experienceUrl = useMemo(() => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}/experiences/${experience.code}`;
  }, [experience.code]);

  const qrCode = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      experienceUrl,
    )}`;
  }, [experienceUrl]);

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{experience.name}</h2>
      <img src={qrCode} alt={`QR code for joining ${experience.name}`} />
      <p className={styles.code}>Code: {experience.code}</p>
    </div>
  );
}
