import { Block, ParticipantSummary } from '@cctv/types';

import { BlockTypeHandler } from '../types';
import { AnnouncementHandler } from './AnnouncementHandler';
import { MadLibHandler } from './MadLibHandler';
import { MultistepFormHandler } from './MultistepFormHandler';
import { PollHandler } from './PollHandler';
import { QuestionHandler } from './QuestionHandler';

export function createBlockHandler(
  kind: Block['kind'],
  participants: ParticipantSummary[],
): BlockTypeHandler {
  switch (kind) {
    case 'poll':
      return new PollHandler();

    case 'question':
      return new QuestionHandler();

    case 'multistep_form':
      return new MultistepFormHandler();

    case 'announcement':
      return new AnnouncementHandler();

    case 'mad_lib':
      return new MadLibHandler(participants);

    default:
      throw new Error(`Unknown block kind: ${kind}`);
  }
}

// Type guard functions for handlers
export function isPollHandler(handler: BlockTypeHandler): handler is PollHandler {
  return handler instanceof PollHandler;
}

export function isQuestionHandler(handler: BlockTypeHandler): handler is QuestionHandler {
  return handler instanceof QuestionHandler;
}

export function isMultistepFormHandler(handler: BlockTypeHandler): handler is MultistepFormHandler {
  return handler instanceof MultistepFormHandler;
}

export function isAnnouncementHandler(handler: BlockTypeHandler): handler is AnnouncementHandler {
  return handler instanceof AnnouncementHandler;
}

export function isMadLibHandler(handler: BlockTypeHandler): handler is MadLibHandler {
  return handler instanceof MadLibHandler;
}
