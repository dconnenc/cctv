import { useState } from 'react';

import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { useCreateSegment, useDeleteSegment, useUpdateSegment } from '@cctv/hooks';
import { ExperienceSegment } from '@cctv/types';

import styles from './SegmentManager.module.scss';

interface SegmentManagerProps {
  segments: ExperienceSegment[];
}

export default function SegmentManager({ segments }: SegmentManagerProps) {
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
          <button className={styles.smallBtn} onClick={() => setIsAdding(true)}>
            + Add
          </button>
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
                <button
                  className={styles.smallBtn}
                  onClick={() => handleUpdate(seg.id)}
                  disabled={isUpdating}
                >
                  Save
                </button>
                <button className={styles.smallBtn} onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <span key={seg.id} onClick={() => startEditing(seg)} style={{ cursor: 'pointer' }}>
                <SegmentBadge
                  name={seg.name}
                  color={seg.color}
                  onRemove={() => handleDelete(seg.id)}
                />
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
          <button
            className={styles.addBtn}
            onClick={handleCreate}
            disabled={isCreating || isDeleting}
          >
            {isCreating ? '...' : 'Add'}
          </button>
          <button className={styles.smallBtn} onClick={() => setIsAdding(false)}>
            Cancel
          </button>
        </div>
      )}

      {createError && <div className={styles.error}>{createError}</div>}
    </div>
  );
}
