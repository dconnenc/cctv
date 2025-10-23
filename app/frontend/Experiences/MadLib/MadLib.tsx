import { MadLibPart } from '@cctv/types';

import styles from './MadLib.module.scss';

interface MadLibProps {
  parts: MadLibPart[];
  responses?: {
    total: number;
    user_responded: boolean;
    user_response: null;
    resolved_variables?: Record<string, string>;
  };
}

export default function MadLib({ parts, responses }: MadLibProps) {
  const resolvedVariables = responses?.resolved_variables || {};

  const renderMadLib = () => {
    return parts
      .map((part) => {
        if (part.type === 'text') {
          return part.content;
        } else {
          const value = resolvedVariables[part.content];
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
