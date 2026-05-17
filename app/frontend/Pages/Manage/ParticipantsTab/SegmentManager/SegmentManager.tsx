import { useState } from 'react';

import { Plus, X } from 'lucide-react';

import { Button } from '@cctv/core';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { useCreateSegment, useDeleteSegment, useUpdateSegment } from '@cctv/hooks';
import { ExperienceSegment } from '@cctv/types';

import styles from './SegmentManager.module.scss';

interface SegmentManagerProps {
  segments: ExperienceSegment[];
  defaultSegmentId?: string | null;
}

export default function SegmentManager({ segments, defaultSegmentId }: SegmentManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const { createSegment, isLoading: isCreating, error: createError } = useCreateSegment();
  const { updateSegment, isLoading: isUpdating } = useUpdateSegment();
  const { deleteSegment, isLoading: isDeleting } = useDeleteSegment();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const result = await createSegment(newName.trim(), newColor);
    if (result) {
      setNewName('');
      setNewColor('#6B7280');
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateSegment(id, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteSegment(id);
  };

  const startEditing = (segment: ExperienceSegment) => {
    setEditingId(segment.id);
    setEditName(segment.name);
    setEditColor(segment.color);
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>Segments</span>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={12} />}
            onClick={() => setIsAdding(true)}
          >
            Add
          </Button>
        )}
      </div>

      {segments.length > 0 && (
        <div className={styles.segments}>
          {segments.map((seg) =>
            editingId === seg.id ? (
              <div key={seg.id} className={styles.addForm}>
                <input
                  className={styles.nameInput}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(seg.id)}
                />
                <input
                  type="color"
                  className={styles.colorInput}
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate(seg.id)}
                  disabled={isUpdating}
                >
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <span key={seg.id} className={styles.segmentItem}>
                <button
                  type="button"
                  className={styles.segmentEditButton}
                  onClick={() => startEditing(seg)}
                  aria-label={`Edit segment ${seg.name}`}
                >
                  <SegmentBadge name={seg.name} color={seg.color} />
                </button>
                {seg.id === defaultSegmentId && (
                  <span className={styles.defaultTag} title="Auto-assigned to new audience members">
                    Default
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X size={12} />}
                  hideLabel
                  onClick={() => handleDelete(seg.id)}
                >
                  Delete segment {seg.name}
                </Button>
              </span>
            ),
          )}
        </div>
      )}

      {isAdding && (
        <div className={styles.addForm}>
          <input
            className={styles.nameInput}
            placeholder="Segment name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <input
            type="color"
            className={styles.colorInput}
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isCreating || isDeleting}
            loading={isCreating}
            loadingText="…"
          >
            Add
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </div>
      )}

      {createError && <div className={styles.error}>{createError}</div>}
    </div>
  );
}
