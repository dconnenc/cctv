import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useLocation } from 'react-router-dom';

import { AnalyticsEvent, capture } from '@cctv/analytics';
import { useUser } from '@cctv/contexts/UserContext';
import { FeedbackType } from '@cctv/types';

import { FeedbackErrorPrompt } from './FeedbackErrorPrompt';
import { FeedbackPanel } from './FeedbackPanel';
import { FeedbackTrigger } from './FeedbackTrigger';
import { type PendingErrorReport, subscribeToErrorReports } from './errorReporter';
import { setFeedbackRoute } from './feedbackContext';

/**
 * The monitor is a projected display nobody interacts with, and the playbill is
 * a printed-style handout — neither should carry a floating button.
 */
const HIDDEN_ROUTE_SEGMENTS = ['/monitor', '/playbill'];

interface FeedbackPanelState {
  defaultType?: FeedbackType;
  enrichFeedbackId?: string;
}

interface FeedbackContextValue {
  isOpen: boolean;
  openFeedback: (options?: FeedbackPanelState) => void;
  closeFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used within a FeedbackProvider');
  return context;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUser();
  const location = useLocation();
  const [panel, setPanel] = useState<FeedbackPanelState | null>(null);
  const [pendingError, setPendingError] = useState<PendingErrorReport | null>(null);

  useEffect(() => {
    setFeedbackRoute(location.pathname);
  }, [location.pathname]);

  // Errors are filed the moment they happen; this only decides whether to invite
  // the person to describe what they were doing.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    return subscribeToErrorReports(setPendingError);
  }, [isAuthenticated]);

  const openFeedback = useCallback((options: FeedbackPanelState = {}) => {
    setPanel(options);
    capture(AnalyticsEvent.FeedbackOpened, {
      source: options.enrichFeedbackId ? 'error' : 'manual',
    });
  }, []);

  const closeFeedback = useCallback(() => setPanel(null), []);

  const hiddenRoute = HIDDEN_ROUTE_SEGMENTS.some((segment) => location.pathname.includes(segment));
  const available = isAuthenticated && !hiddenRoute;

  const value = useMemo(
    () => ({ isOpen: panel !== null, openFeedback, closeFeedback }),
    [panel, openFeedback, closeFeedback],
  );

  const describeError = useCallback(() => {
    if (!pendingError) return;
    openFeedback({ defaultType: FeedbackType.BUG, enrichFeedbackId: pendingError.feedbackId });
    setPendingError(null);
  }, [openFeedback, pendingError]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {available && (
        <>
          <FeedbackTrigger onClick={() => openFeedback()} />

          {pendingError && (
            <FeedbackErrorPrompt
              message={pendingError.message}
              onDescribe={describeError}
              onDismiss={() => setPendingError(null)}
            />
          )}

          <FeedbackPanel
            open={panel !== null}
            defaultType={panel?.defaultType}
            enrichFeedbackId={panel?.enrichFeedbackId}
            onOpenChange={(open) => {
              if (!open) closeFeedback();
            }}
          />
        </>
      )}
    </FeedbackContext.Provider>
  );
}
