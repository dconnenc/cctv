import { Block, JsonObject, JsonValue, ParticipantSummary } from '@cctv/types';

interface BlockResponsesListProps {
  block: Block;
  participants: ParticipantSummary[];
}

interface ListedResponse {
  id: string;
  experience_participant_id: string;
  answer?: JsonValue;
  photo_url?: string;
  created_at: string;
}

function listedResponses(block: Block): ListedResponse[] {
  const { responses } = block;
  if (!responses || !('all_responses' in responses)) return [];
  return responses.all_responses ?? [];
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function answerText(answer: JsonValue | undefined): string | null {
  if (answer === undefined || answer === null) return null;

  if (isJsonObject(answer)) {
    if (Object.keys(answer).length === 0) return null;
    return 'value' in answer ? String(answer.value) : JSON.stringify(answer, null, 2);
  }

  if (Array.isArray(answer)) {
    return answer.length === 0 ? null : JSON.stringify(answer, null, 2);
  }

  return String(answer);
}

export default function BlockResponsesList({ block, participants }: BlockResponsesListProps) {
  const allResponses = listedResponses(block);

  if (allResponses.length === 0) {
    return (
      <div className="text-center text-[hsl(var(--muted-foreground))] py-8">No responses yet</div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {allResponses.map((response, index) => {
        const participant = participants.find((p) => p.id === response.experience_participant_id);
        const answer = answerText(response.answer);
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
                  marginBottom: answer === null ? 0 : '0.5rem',
                }}
              />
            )}
            {answer !== null && <div className="text-sm text-white">{answer}</div>}
          </div>
        );
      })}
    </div>
  );
}
