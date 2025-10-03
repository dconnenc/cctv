import { MadLibSegment } from '@cctv/types';

import styles from './MadLib.module.scss';

interface MadLibProps {
  blockId: string;
  segments: MadLibSegment[];
  responses?: {
    total: number;
    user_responded: boolean;
    user_response: null;
    resolved_variables?: Record<string, string>;
  };
}

export default function MadLib({ blockId, segments, responses }: MadLibProps) {
  const resolvedVariables = responses?.resolved_variables || {};

  const renderMadLib = () => {
    return segments
      .map((segment) => {
        if (segment.type === 'text') {
          return segment.content;
        } else {
          const value = resolvedVariables[segment.content];
          return value ? `<strong>${value}</strong>` : `<em>_____</em>`;
        }
      })
      .join('');
  };

  return (
    <div className={styles.madLib}>
      <div className={styles.template}>
        <div dangerouslySetInnerHTML={{ __html: renderMadLib() }} />
      </div>
    </div>
  );
}
