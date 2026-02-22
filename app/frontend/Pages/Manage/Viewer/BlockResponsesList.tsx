import { Block, BlockResponse, ParticipantSummary } from '@cctv/types';

interface BlockResponsesListProps {
  block: Block;
  participants: ParticipantSummary[];
}

export default function BlockResponsesList({ block, participants }: BlockResponsesListProps) {
  const responses = block.responses as { all_responses?: BlockResponse[] } | undefined;
  const allResponses = responses?.all_responses;

  if (!allResponses || allResponses.length === 0) {
    return (
      <div className="text-center text-[hsl(var(--muted-foreground))] py-8">No responses yet</div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {allResponses.map((response, index) => {
        const participant = participants.find((p) => p.user_id === response.user_id);
        return (
          <div
            key={response.id}
            className="p-3 bg-[hsl(var(--background))] rounded-md border border-[hsl(var(--border))]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                #{index + 1} • {participant?.name || 'Unknown'}
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {new Date(response.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm text-white">
              {typeof response.answer === 'object'
                ? JSON.stringify(response.answer, null, 2)
                : String(response.answer)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
