'use client';

import { useId } from 'react';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DayPickerProps } from 'react-day-picker';

import { cn } from '@cctv/utils/cn';

import { Calendar } from '../Calendar/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover';

import inputStyles from '../TextInput/TextInput.module.scss';
import styles from './DatePicker.module.scss';

export type DatePickerProps = {
  label?: string;
  placeholder?: string;
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: boolean;
  id?: string;
} & Omit<DayPickerProps, 'mode' | 'selected' | 'onSelect'>;

export function DatePicker({
  label,
  placeholder = 'Pick a date',
  date,
  onSelect,
  disabled,
  id,
  className,
  ...calendarProps
}: DatePickerProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;

  return (
    <div className={cn(inputStyles.input, className)}>
      {label ? (
        <label className={inputStyles.label} htmlFor={triggerId}>
          {label}
        </label>
      ) : null}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={triggerId}
            disabled={disabled}
            className={cn(inputStyles.control, styles.trigger)}
          >
            <CalendarIcon size={18} aria-hidden />
            {date ? (
              <span>{format(date, 'PPP')}</span>
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={onSelect} {...calendarProps} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
