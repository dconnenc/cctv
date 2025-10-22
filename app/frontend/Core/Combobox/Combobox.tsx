import { ReactNode, useState } from 'react';

import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@cctv/utils/cn';

import styles from './Combobox.module.scss';

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface ComboboxStickyOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface ComboboxProps {
  options: ComboboxOption[];
  stickyOption?: ComboboxStickyOption;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  noResultsText?: string;
  searchIcon?: ReactNode;
}

export function Combobox({
  options,
  stickyOption,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No items yet.',
  noResultsText = 'No results found.',
  searchIcon,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedOption =
    stickyOption?.value === value ? stickyOption : options.find((opt) => opt.value === value);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className={styles.trigger} aria-expanded={open}>
          <div className={styles.triggerContent}>
            {selectedOption?.icon}
            <span className={selectedOption ? styles.label : styles.placeholder}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronsUpDown size={16} className={styles.chevron} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={styles.content} align="start" sideOffset={8}>
          <Command className={styles.command}>
            <div className={styles.searchWrapper}>
              {searchIcon}
              <Command.Input
                placeholder={searchPlaceholder}
                value={search}
                onValueChange={setSearch}
                className={styles.searchInput}
              />
            </div>

            {stickyOption && (
              <div className={styles.stickySection}>
                <button
                  className={cn(styles.item, value === stickyOption.value && styles.selected)}
                  onClick={() => {
                    onChange(stickyOption.value);
                    setOpen(false);
                  }}
                  type="button"
                >
                  {stickyOption.icon}
                  <span>{stickyOption.label}</span>
                  {value === stickyOption.value && <Check size={16} className={styles.check} />}
                </button>
              </div>
            )}

            <Command.List className={styles.list}>
              <Command.Empty className={styles.empty}>
                {search && options.length > 0 ? noResultsText : emptyText}
              </Command.Empty>
              {options.length > 0 && (
                <Command.Group className={styles.group}>
                  {filteredOptions.map((option) => (
                    <Command.Item
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(styles.item, value === option.value && styles.selected)}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                      {value === option.value && <Check size={16} className={styles.check} />}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
