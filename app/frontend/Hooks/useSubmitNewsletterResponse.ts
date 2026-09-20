import { useCallback, useState } from 'react';

import { trackSubmissionFailed, trackSubmissionSucceeded } from '@cctv/analytics';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';

export function useSubmitNewsletterResponse() {
  const { code, experienceFetch } = useExperience();
  const { setSubmissionState } = useExperienceState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitNewsletterResponse = useCallback(
    async (
      blockId: string,
      subscribed: boolean,
    ): Promise<{ success: boolean; error?: string } | null> => {
      if (!code || !blockId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const res = await experienceFetch(
          `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(blockId)}/submit_newsletter_response`,
          {
            method: 'POST',
            body: JSON.stringify({
              answer: { subscribed, submittedAt: new Date().toISOString() },
            }),
          },
        );

        const data = await res.json();

        if (!data?.success) {
          const msg = data?.error || 'Newsletter submission failed';
          setError(msg);
          trackSubmissionFailed(blockId, 'newsletter_signup', 'rejected', msg);
          return { success: false, error: msg };
        }

        if (data.submission) {
          setSubmissionState((prev) => ({
            ...prev,
            [blockId]: { id: data.submission.id, answer: data.submission.answer },
          }));
        }

        trackSubmissionSucceeded(blockId, 'newsletter_signup');

        return { success: true };
      } catch (e: unknown) {
        const msg =
          e instanceof Error && e.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        trackSubmissionFailed(
          blockId,
          'newsletter_signup',
          e instanceof Error && e.message === 'Authentication expired' ? 'auth_expired' : 'network',
          msg,
        );
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch, setSubmissionState],
  );

  return { submitNewsletterResponse, isLoading, error };
}
