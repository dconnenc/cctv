import { PropsWithChildren, ReactNode, useEffect } from 'react';

import { createPortal } from 'react-dom';

import { Button } from '../Button/Button';

import styles from './Modal.module.scss';

type ModalProps = PropsWithChildren<{
  title?: ReactNode;
  onClose: () => void;
  className?: string;
}>;

export const Modal = ({ title, onClose, className, children }: ModalProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const content = (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`${styles.dialog} ${className || ''}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          {title && <h4 className={styles.title}>{title}</h4>}
          <Button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
