import { ChangeEvent, useId, useRef } from 'react';

import classNames from 'classnames';
import { ImagePlus, X } from 'lucide-react';

import inputStyles from '../TextInput/TextInput.module.scss';
import styles from './ImageUpload.module.scss';

export type ImageUploadProps = {
  label?: string;
  imageUrl?: string | null;
  onFileSelected: (file: File) => void;
  onRemove?: () => void;
  shape?: 'rect' | 'circle';
  previewSize?: string;
  accept?: string;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadButtonLabel?: string;
  changeButtonLabel?: string;
  helpText?: string;
  id?: string;
};

export function ImageUpload({
  label,
  imageUrl,
  onFileSelected,
  onRemove,
  shape = 'rect',
  previewSize = '12rem',
  accept = 'image/*',
  disabled = false,
  isUploading = false,
  uploadProgress,
  uploadButtonLabel = 'Upload image',
  changeButtonLabel = 'Change image',
  helpText,
  id,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const buttonId = id ?? generatedId;

  const triggerPicker = () => inputRef.current?.click();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = '';
  };

  const previewStyle = {
    width: previewSize,
    height: shape === 'circle' ? previewSize : undefined,
  };

  const buttonLabel = isUploading
    ? uploadProgress != null
      ? `Uploading… ${Math.round(uploadProgress)}%`
      : 'Uploading…'
    : imageUrl
      ? changeButtonLabel
      : uploadButtonLabel;

  return (
    <div className={inputStyles.input}>
      {label && (
        <label className={inputStyles.label} htmlFor={buttonId}>
          {label}
        </label>
      )}
      <div className={styles.row}>
        {imageUrl && (
          <div
            className={classNames(styles.preview, {
              [styles.previewCircle]: shape === 'circle',
            })}
            style={previewStyle}
          >
            <img src={imageUrl} alt={label ?? 'Selected image'} className={styles.previewImg} />
            {onRemove && !isUploading && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={onRemove}
                aria-label="Remove image"
                disabled={disabled}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          id={buttonId}
          className={styles.uploadBtn}
          onClick={triggerPicker}
          disabled={disabled || isUploading}
        >
          <ImagePlus size={16} aria-hidden />
          <span>{buttonLabel}</span>
        </button>
      </div>
      {helpText && <span className={styles.helpText}>{helpText}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        onChange={handleChange}
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
