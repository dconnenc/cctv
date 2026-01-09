import { useEffect, useState } from 'react';

import { X } from 'lucide-react';

import styles from './XAnimation.module.scss';

interface XAnimationProps {
  show: boolean;
}

export default function XAnimation({ show }: XAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.xContainer}>
        <X className={styles.xIcon} size={200} strokeWidth={8} />
      </div>
    </div>
  );
}
