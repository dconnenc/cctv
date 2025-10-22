import { useMemo } from 'react';

import { Search, Tv } from 'lucide-react';

import { Combobox, ComboboxOption, ComboboxStickyOption } from '@cctv/core';
import { ParticipantSummary } from '@cctv/types';

interface ViewSelectorProps {
  participants: ParticipantSummary[];
  value?: string;
  onChange: (value: string) => void;
}

export function ViewSelector({ participants, value, onChange }: ViewSelectorProps) {
  const stickyOption: ComboboxStickyOption = {
    value: 'tv',
    label: 'TV',
    icon: <Tv size={16} />,
  };

  const participantOptions: ComboboxOption[] = useMemo(
    () =>
      participants.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [participants],
  );

  return (
    <Combobox
      options={participantOptions}
      stickyOption={stickyOption}
      value={value}
      onChange={onChange}
      placeholder="Change channel"
      searchPlaceholder="Search participants..."
      emptyText="No participants."
      noResultsText="No results found."
      searchIcon={<Search size={16} style={{ opacity: 0.5 }} />}
    />
  );
}
