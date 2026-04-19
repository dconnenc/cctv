'use client';

import { ChangeEvent, useEffect, useId, useRef, useState } from 'react';

import * as chrono from 'chrono-node';
import classNames from 'classnames';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Calendar } from '../Calendar/Calendar';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../Popover/Popover';

import inputStyles from '../TextInput/TextInput.module.scss';
import styles from './NaturalDatePicker.module.scss';

export type NaturalDatePickerProps = {
  label?: string;
  placeholder?: string;
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  displayFormat?: string;
};

function formatDate(date: Date | undefined, pattern: string): string {
  if (!date || !isValid(date)) return '';
  return format(date, pattern);
}

export function NaturalDatePicker({
  label,
  placeholder = 'e.g. tomorrow, next Friday, Apr 15',
  date,
  onSelect,
  disabled,
  id,
  name,
  displayFormat = 'PPP',
}: NaturalDatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [text, setText] = useState(formatDate(date, displayFormat));
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(formatDate(date, displayFormat));
  }, [date, displayFormat]);

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setText(next);
    if (!next.trim()) {
      onSelect?.(undefined);
      return;
    }
    const parsed = chrono.parseDate(next);
    if (parsed) onSelect?.(parsed);
  };

  const handleCalendarSelect = (selected: Date | undefined) => {
    onSelect?.(selected);
    setText(formatDate(selected, displayFormat));
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={inputStyles.input}>
      {label && (
        <label className={inputStyles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className={styles.field}>
            <input
              ref={inputRef}
              id={inputId}
              name={name}
              type="text"
              disabled={disabled}
              value={text}
              onChange={handleTextChange}
              placeholder={placeholder}
              className={classNames(inputStyles.control, styles.input)}
              autoComplete="off"
            />
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                aria-label="Open calendar"
                className={styles.calendarBtn}
              >
                <CalendarIcon size={16} aria-hidden />
              </button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleCalendarSelect}
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
