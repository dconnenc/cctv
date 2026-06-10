import { GuessWhoBlock } from '@cctv/types';

import GuessWhoMonitor from './GuessWhoMonitor';
import GuessWhoParticipant from './GuessWhoParticipant';

interface GuessWhoProps {
  block: GuessWhoBlock;
  viewContext?: 'participant' | 'monitor' | 'manage';
}

export default function GuessWho({ block, viewContext = 'participant' }: GuessWhoProps) {
  if (viewContext === 'monitor' || viewContext === 'manage') {
    return <GuessWhoMonitor block={block} viewContext={viewContext} />;
  }

  return <GuessWhoParticipant block={block} />;
}
