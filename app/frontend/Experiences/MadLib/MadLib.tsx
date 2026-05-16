import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { BlockKind, MadLibBlock, MadLibPart } from '@cctv/types';

import Poll from '../Poll/Poll';
import Question from '../Question/Question';

import styles from './MadLib.module.scss';

interface MadLibProps {
  block: MadLibBlock;
}

function computeResolvedVariables(
  block: MadLibBlock,
  submissionState: Record<string, { id?: string; answer?: Record<string, unknown> }>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const variable of block.variables ?? []) {
    const binding = (block.variable_bindings ?? []).find((b) => b.variable_id === variable.id);
    if (!binding) continue;

    const submission = submissionState[binding.source_block_id];
    if (!submission) continue;

    const sourceBlock = (block.children ?? []).find((c) => c.id === binding.source_block_id);
    if (!sourceBlock) continue;

    if (sourceBlock.kind === BlockKind.QUESTION) {
      const value = submission.answer?.value as string | undefined;
      if (value) result[variable.key] = value;
    } else if (sourceBlock.kind === BlockKind.POLL) {
      const options = submission.answer?.selectedOptions as string[] | string | undefined;
      const first = Array.isArray(options) ? options[0] : options;
      if (first) result[variable.key] = first;
    }
  }

  return result;
}

function renderTemplate(parts: MadLibPart[], resolvedVariables: Record<string, string>): string {
  return parts
    .map((part) => {
      if (part.type === 'text') return part.content;
      const value = resolvedVariables[part.content];
      return value ? `<strong>${value}</strong>` : `<em>_____</em>`;
    })
    .join('');
}

export default function MadLib({ block }: MadLibProps) {
  const { submissionState } = useExperienceState();

  if (block.responses?.resolved_variables !== undefined) {
    return (
      <div className={styles.madLib}>
        <div className={styles.template}>
          <div
            dangerouslySetInnerHTML={{
              __html: renderTemplate(block.payload.parts, block.responses.resolved_variables),
            }}
          />
        </div>
      </div>
    );
  }

  const visibleChildren = block.children ?? [];
  const unrespondedChild = visibleChildren.find((child) => !submissionState[child.id]);

  if (unrespondedChild) {
    if (unrespondedChild.kind === BlockKind.QUESTION) {
      return (
        <Question
          blockId={unrespondedChild.id}
          responses={unrespondedChild.responses}
          {...unrespondedChild.payload}
        />
      );
    }
    if (unrespondedChild.kind === BlockKind.POLL) {
      const { question, options, pollType = 'single' } = unrespondedChild.payload;
      return (
        <Poll
          question={question}
          options={options}
          pollType={pollType}
          blockId={unrespondedChild.id}
          responses={unrespondedChild.responses}
        />
      );
    }
  }

  const resolvedVariables = computeResolvedVariables(block, submissionState);

  return (
    <div className={styles.madLib}>
      <div className={styles.template}>
        <div
          dangerouslySetInnerHTML={{
            __html: renderTemplate(block.payload.parts, resolvedVariables),
          }}
        />
      </div>
    </div>
  );
}
