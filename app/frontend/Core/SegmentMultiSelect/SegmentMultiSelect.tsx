import { DEFAULT_SEGMENT_COLOR, SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { ExperienceSegment } from '@cctv/types';

import styles from './SegmentMultiSelect.module.scss';

interface SegmentMultiSelectProps {
  segments: ExperienceSegment[];
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function SegmentMultiSelect({
  segments,
  value,
  onChange,
  label = 'Visible to segments',
  placeholder = 'Visible to all participants',
}: SegmentMultiSelectProps) {
  const available = segments.filter((s) => !value.includes(s.name));

  return (
    <div className={styles.root}>
      <label className={styles.label}>{label}</label>
      <div className={styles.row}>
        {value.length === 0 && <span className={styles.placeholder}>{placeholder}</span>}
        {value.map((name) => {
          const seg = segments.find((s) => s.name === name);
          return (
            <SegmentBadge
              key={name}
              name={name}
              color={seg?.color || DEFAULT_SEGMENT_COLOR}
              onRemove={() => onChange(value.filter((n) => n !== name))}
            />
          );
        })}
        {available.length > 0 && (
          <select
            aria-label="Add segment"
            className={styles.select}
            value=""
            onChange={(e) => {
              if (e.target.value) {
                onChange([...value, e.target.value]);
              }
            }}
          >
            <option value="">+ Add segment...</option>
            {available.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
