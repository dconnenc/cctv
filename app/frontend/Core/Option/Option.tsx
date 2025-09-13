import styles from './Option.module.scss';

interface OptionProps {
  /** Whether multiple options can be selected */
  allowMultiple?: boolean;

  /**
   * The name of the input.
   * Should be shared with all Options to ensure only one option is selected.
   */
  name: string;

  /** The option text */
  option: string;
}

/**
 * Reusable option component for polls and other forms
 *
 * @remarks see {@link Poll} for an example of how to use this component.
 * */
export const Option = ({ allowMultiple, name, option }: OptionProps) => {
  return (
    <label htmlFor={option} className={styles.option}>
      <input
        className={styles.input}
        id={option}
        type={allowMultiple ? 'checkbox' : 'radio'}
        name={name}
        value={option}
      />
      {option}
    </label>
  );
};
