import { DayPicker, type DayPickerProps } from 'react-day-picker';
import 'react-day-picker/style.css';

import styles from './Calendar.module.scss';

function Calendar({ className, ...props }: DayPickerProps) {
  return (
    <DayPicker className={className ? `${styles.picker} ${className}` : styles.picker} {...props} />
  );
}

export { Calendar };
