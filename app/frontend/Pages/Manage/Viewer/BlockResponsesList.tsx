import { Block, BlockResponse, ParticipantSummary } from '@cctv/types';

interface BlockResponsesListProps {
  block: Block;
  participants: ParticipantSummary[];
}

export default function BlockResponsesList({ block, participants }: BlockResponsesListProps) {
  const responses = block.responses as
    | { all_responses?: Array<BlockResponse & { photo_url?: string }> }
    | undefined;
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
        const hasAnswer =
          response.answer != null &&
          !(
            typeof response.answer === 'object' &&
            Object.keys(response.answer as Record<string, unknown>).length === 0
          );
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
            {response.photo_url && (
              <img
                src={response.photo_url}
                alt={`Response from ${participant?.name || 'Unknown'}`}
                style={{
                  maxWidth: '12rem',
                  borderRadius: '0.375rem',
                  border: '1px solid hsl(var(--border))',
                  marginBottom: hasAnswer ? '0.5rem' : 0,
                }}
              />
            )}
            {hasAnswer && (
              <div className="text-sm text-white">
                {typeof response.answer === 'object'
                  ? JSON.stringify(response.answer, null, 2)
                  : String(response.answer)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
