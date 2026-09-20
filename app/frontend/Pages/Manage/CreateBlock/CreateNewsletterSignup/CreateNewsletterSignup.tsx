import { TextInput } from '@cctv/core/TextInput/TextInput';
import {
  BlockKind,
  BlockStatus,
  NewsletterSignupApiPayload,
  NewsletterSignupData,
  NewsletterSignupPayload,
  ParticipantSummary,
} from '@cctv/types';
import { BlockComponentProps } from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';

export const getDefaultNewsletterSignupState = (): NewsletterSignupData => ({
  prompt: '',
  confirmationMessage: '',
  declineMessage: '',
});

export const validateNewsletterSignup = (_data: NewsletterSignupData): string | null => null;

export const buildNewsletterSignupPayload = (
  data: NewsletterSignupData,
): NewsletterSignupApiPayload => ({
  type: BlockKind.NEWSLETTER_SIGNUP,
  prompt: data.prompt.trim() || undefined,
  confirmationMessage: data.confirmationMessage.trim() || undefined,
  declineMessage: data.declineMessage.trim() || undefined,
});

export const canNewsletterSignupOpenImmediately = (
  _data: NewsletterSignupData,
  _participants: ParticipantSummary[],
): boolean => true;

export const newsletterSignupPayloadToFormData = (
  payload: NewsletterSignupPayload,
): NewsletterSignupData => ({
  prompt: payload.prompt || '',
  confirmationMessage: payload.confirmationMessage || '',
  declineMessage: payload.declineMessage || '',
});

export const processNewsletterSignupBeforeSubmit = (
  data: NewsletterSignupData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
): NewsletterSignupData => data;

export default function CreateNewsletterSignup({
  data,
  onChange,
}: BlockComponentProps<NewsletterSignupData>) {
  return (
    <div className={sharedStyles.container}>
      <TextInput
        label="Prompt"
        placeholder="Can we add you to our mailing list?"
        value={data.prompt}
        onChange={(e) => onChange?.({ prompt: e.target.value })}
      />
      <TextInput
        label="Confirmation message (optional)"
        placeholder="Thanks — you're on the list!"
        value={data.confirmationMessage}
        onChange={(e) => onChange?.({ confirmationMessage: e.target.value })}
      />
      <TextInput
        label="Decline message (optional)"
        placeholder="No problem — maybe next time."
        value={data.declineMessage}
        onChange={(e) => onChange?.({ declineMessage: e.target.value })}
      />
    </div>
  );
}
