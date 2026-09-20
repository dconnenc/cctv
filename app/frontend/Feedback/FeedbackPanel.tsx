import { useEffect, useState } from 'react';

import { Check } from 'lucide-react';

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@cctv/core';
import { FeedbackSource, FeedbackType } from '@cctv/types';

import { FeedbackForm } from './FeedbackForm';

import styles from './FeedbackPanel.module.scss';

export interface FeedbackPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: FeedbackType;
  /** Set when the panel is adding detail to an already-filed error report. */
  enrichFeedbackId?: string;
}

const CONFIRMATION_MS = 1600;

export function FeedbackPanel({
  open,
  onOpenChange,
  defaultType,
  enrichFeedbackId,
}: FeedbackPanelProps) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) setSubmitted(false);
  }, [open]);

  useEffect(() => {
    if (!submitted) return undefined;

    const timer = window.setTimeout(() => onOpenChange(false), CONFIRMATION_MS);
    return () => window.clearTimeout(timer);
  }, [submitted, onOpenChange]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal>
      <DrawerContent side="right" showOverlay aria-describedby="feedback-panel-description">
        <DrawerHeader>
          <DrawerTitle>{enrichFeedbackId ? 'What were you doing?' : 'Send feedback'}</DrawerTitle>
          <DrawerDescription id="feedback-panel-description">
            {enrichFeedbackId
              ? 'We already logged the error. Anything you add helps us reproduce it.'
              : 'Tell us what is broken, confusing, or missing. We read everything.'}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          {submitted ? (
            <output className={styles.confirmation}>
              <Check className={styles.confirmationIcon} aria-hidden="true" />
              <p className={styles.confirmationText}>Thanks — this is on our list.</p>
            </output>
          ) : (
            <FeedbackForm
              source={FeedbackSource.MANUAL}
              defaultType={defaultType}
              enrichFeedbackId={enrichFeedbackId}
              submitLabel={enrichFeedbackId ? 'Add details' : 'Send feedback'}
              onSubmitted={() => setSubmitted(true)}
            />
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
