import { useCallback, useEffect, useRef, useState } from 'react';

import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, X } from 'lucide-react';

import { Button, TextInput } from '@cctv/core';
import { useDirectUpload, useUpdatePlaybill } from '@cctv/hooks';
import { PlaybillSection } from '@cctv/types';

import styles from './PlaybillTab.module.scss';

function generateId(): string {
  return crypto.randomUUID();
}

function makeEmptySection(): PlaybillSection {
  return { id: generateId(), title: '', body: '' };
}

interface PlaybillTabProps {
  playbill: PlaybillSection[];
}

export default function PlaybillTab({ playbill }: PlaybillTabProps) {
  const [sections, setSections] = useState<PlaybillSection[]>(playbill);
  const { updatePlaybill, isLoading, error } = useUpdatePlaybill();
  const { upload: directUpload, isUploading, progress, error: uploadError } = useDirectUpload();
  const [uploadingSectionId, setUploadingSectionId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setSections(playbill);
  }, [playbill]);

  const isDirty = JSON.stringify(sections) !== JSON.stringify(playbill);

  const handleAdd = useCallback(() => {
    setSections((prev) => [...prev, makeEmptySection()]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setSections((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleChange = useCallback((id: string, field: keyof PlaybillSection, value: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }, []);

  const handleImageUpload = useCallback(
    async (sectionId: string, file: File) => {
      setUploadingSectionId(sectionId);
      try {
        const { signedId } = await directUpload(file);
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId
              ? { ...s, image_signed_id: signedId, image_url: URL.createObjectURL(file) }
              : s,
          ),
        );
      } finally {
        setUploadingSectionId(null);
      }
    },
    [directUpload],
  );

  const handleRemoveImage = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, image_signed_id: undefined, image_url: undefined } : s,
      ),
    );
  }, []);

  const handleSave = useCallback(async () => {
    const payload = sections.map(({ image_url: _url, ...rest }) => rest);
    await updatePlaybill(payload);
  }, [updatePlaybill, sections]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Playbill Sections</span>
        <Button onClick={handleAdd}>
          <Plus size={14} />
          <span>Add Section</span>
        </Button>
      </div>

      {sections.length === 0 && (
        <div className={styles.empty}>No playbill sections yet. Click "Add Section" to start.</div>
      )}

      {sections.map((section, index) => (
        <div key={section.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardActions}>
              <button
                className={styles.iconBtn}
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                title="Move up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                className={styles.iconBtn}
                onClick={() => handleMoveDown(index)}
                disabled={index === sections.length - 1}
                title="Move down"
              >
                <ArrowDown size={14} />
              </button>
              <button
                className={styles.iconBtnDanger}
                onClick={() => handleRemove(section.id)}
                title="Remove section"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <TextInput
              label="Title"
              value={section.title}
              onChange={(e) => handleChange(section.id, 'title', e.target.value)}
              placeholder="Section title"
            />
            <textarea
              className={styles.textarea}
              value={section.body}
              onChange={(e) => handleChange(section.id, 'body', e.target.value)}
              placeholder="Section body text"
            />

            <div className={styles.imageField}>
              <span className={styles.imageLabel}>Image (optional)</span>
              {section.image_url ? (
                <div className={styles.imagePreviewWrapper}>
                  <img src={section.image_url} alt="Section" className={styles.imagePreview} />
                  <button
                    className={styles.imageRemoveBtn}
                    onClick={() => handleRemoveImage(section.id)}
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  className={styles.imageUploadBtn}
                  onClick={() => fileInputRefs.current[section.id]?.click()}
                  disabled={isUploading && uploadingSectionId === section.id}
                >
                  <ImagePlus size={16} />
                  <span>
                    {isUploading && uploadingSectionId === section.id
                      ? `Uploading... ${progress}%`
                      : 'Upload image'}
                  </span>
                </button>
              )}
              <input
                ref={(el) => {
                  fileInputRefs.current[section.id] = el;
                }}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(section.id, file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>
      ))}

      <div className={styles.footer}>
        <div>
          {(error || uploadError) && <span className="error-message">{error || uploadError}</span>}
        </div>
        {isDirty && (
          <Button onClick={handleSave} loading={isLoading} loadingText="Saving...">
            Save Playbill
          </Button>
        )}
      </div>
    </div>
  );
}
