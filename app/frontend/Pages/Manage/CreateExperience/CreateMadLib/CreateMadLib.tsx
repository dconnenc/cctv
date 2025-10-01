import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core';
import { BlockKind, BlockStatus, ParticipantSummary } from '@cctv/types';
import { BlockComponentProps, MadLibApiPayload, MadLibData } from '@cctv/types';

import { useCreateBlockContext } from '../CreateBlockContext';

import styles from './CreateMadLib.module.scss';

export const getDefaultMadLibState = (): MadLibData => {
  return {
    segments: [],
    variables: [],
  };
};

export const validateMadLib = (data: MadLibData): string | null => {
  const validSegments = data.segments.filter((s) => s.content.trim());

  if (validSegments.length === 0) {
    return 'Mad lib must have at least one segment';
  }

  const validVariables = data.variables.filter((v) => v.name.trim() && v.question.trim());
  const variableSegments = validSegments.filter((s) => s.type === 'variable');

  if (variableSegments.length > 0 && validVariables.length === 0) {
    return 'Variables must have both name and question configured';
  }

  return null;
};

export const canMadLibOpenImmediately = (
  data: MadLibData,
  participants: ParticipantSummary[],
): boolean => {
  const validVariables = data.variables.filter((v) => v.name.trim() && v.question.trim());
  const unassignedVariables = validVariables.filter(
    (v) => !v.assigned_user_id || v.assigned_user_id === 'random',
  );

  if (unassignedVariables.length > 0) {
    const availableParticipants = participants.filter(
      (p) => !validVariables.some((v) => v.assigned_user_id === p.user_id),
    );

    // Need enough participants for all unassigned variables
    return availableParticipants.length >= unassignedVariables.length;
  }

  return true;
};

// This can be pushed to the server in the future to simplify when the backend
// has a concrete implementation for the block types
export const processMadLibBeforeSubmit = (
  data: MadLibData,
  _status: BlockStatus,
  participants: ParticipantSummary[],
): MadLibData => {
  const validVariables = [...data.variables.filter((v) => v.name.trim() && v.question.trim())];

  const getAvailableParticipants = (excludeVariableIndex?: number): ParticipantSummary[] => {
    return participants.filter((p) => {
      const isAlreadyAssigned = validVariables.some(
        (v, vIndex) => vIndex !== excludeVariableIndex && v.assigned_user_id === p.user_id,
      );
      return !isAlreadyAssigned;
    });
  };

  const availableParticipants = getAvailableParticipants();

  for (let i = 0; i < validVariables.length; i++) {
    const variable = validVariables[i];

    if (variable.assigned_user_id === 'random' && availableParticipants.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableParticipants.length);
      const assignedParticipant = availableParticipants.splice(randomIndex, 1)[0];
      validVariables[i] = {
        ...variable,
        assigned_user_id: assignedParticipant.user_id,
      };
    }
  }

  return {
    ...data,
    variables: validVariables,
  };
};

export const buildMadLibPayload = (data: MadLibData): MadLibApiPayload => {
  const validSegments = data.segments.filter((s) => s.content.trim());
  const validVariables = data.variables.filter((v) => v.name.trim() && v.question.trim());

  return {
    type: BlockKind.MAD_LIB,
    segments: validSegments,
    variables: validVariables,
  };
};

export default function CreateMadLib({ data, onChange }: BlockComponentProps<MadLibData>) {
  const { participants } = useCreateBlockContext();

  const updateSegment = (index: number, content: string) => {
    const newSegments = [...data.segments];
    newSegments[index] = { ...newSegments[index], content };
    onChange?.({ segments: newSegments });
  };

  const addTextSegment = () => {
    const newId = Date.now().toString();
    const newSegments = [...data.segments, { id: newId, type: 'text' as const, content: ' ' }];
    onChange?.({ segments: newSegments });
  };

  const addVariableSegment = () => {
    const newVariableId = Date.now().toString();
    const newSegmentId = (Date.now() + 1).toString();

    const newVariable = {
      id: newVariableId,
      name: 'variable',
      question: 'Enter a word',
      dataType: 'text' as const,
      assigned_user_id: undefined,
    };

    const newSegment = {
      id: newSegmentId,
      type: 'variable' as const,
      content: newVariableId,
    };

    const newData = {
      variables: [...data.variables, newVariable],
      segments: [...data.segments, newSegment],
    };

    onChange?.(newData);
  };

  const removeSegment = (index: number) => {
    const segment = data.segments[index];
    let newSegments = data.segments.filter((_, i) => i !== index);

    let newVariables = data.variables;
    if (segment.type === 'variable') {
      newVariables = data.variables.filter((v) => v.id !== segment.content);
    }

    // Combine consecutive text segments after removal
    const combinedSegments = [];
    for (let i = 0; i < newSegments.length; i++) {
      const currentSegment = newSegments[i];

      if (currentSegment.type === 'text') {
        // Look ahead to see if the next segment is also text
        let combinedContent = currentSegment.content;
        let nextIndex = i + 1;

        while (nextIndex < newSegments.length && newSegments[nextIndex].type === 'text') {
          // Add space between segments if neither ends/starts with whitespace
          const currentEndsWithSpace = combinedContent.endsWith(' ');
          const nextStartsWithSpace = newSegments[nextIndex].content.startsWith(' ');

          if (!currentEndsWithSpace && !nextStartsWithSpace) {
            combinedContent += ' ';
          }

          combinedContent += newSegments[nextIndex].content;
          nextIndex++;
        }

        // Add the combined segment
        combinedSegments.push({
          ...currentSegment,
          content: combinedContent,
        });

        // Skip the segments we just combined
        i = nextIndex - 1;
      } else {
        combinedSegments.push(currentSegment);
      }
    }

    onChange?.({
      segments: combinedSegments,
      variables: newVariables,
    });
  };

  const updateVariable = (variableId: string, updates: any) => {
    const newVariables = data.variables.map((v) =>
      v.id === variableId ? { ...v, ...updates } : v,
    );

    onChange?.({ variables: newVariables });
  };

  const getAvailableParticipants = (excludeVariableIndex?: number) => {
    return participants.filter((p) => {
      const isAlreadyAssigned = data.variables.some(
        (v, vIndex) => vIndex !== excludeVariableIndex && v.assigned_user_id === p.user_id,
      );
      return !isAlreadyAssigned;
    });
  };

  const canAddTextSegment = () => {
    if (data.segments.length === 0) return true;
    const lastSegment = data.segments[data.segments.length - 1];
    return lastSegment.type !== 'text';
  };

  return (
    <div className={styles.details}>
      <div className={styles.madLibBuilder}>
        <div className={styles.builderSection}>
          <div>Mad Lib Builder</div>
          <div className={styles.preview}>
            {data.segments.map((segment) => (
              <span key={segment.id} className={styles.segment}>
                {segment.type === 'text' ? (
                  <span className={styles.textSegment}>{segment.content}</span>
                ) : (
                  <span className={styles.variableSegment}>
                    {data.variables.find((v) => v.id === segment.content)?.name || '[Variable]'}
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className={styles.builderControls}>
            <Button type="button" onClick={addTextSegment} disabled={!canAddTextSegment()}>
              Add Text
            </Button>
            <Button type="button" onClick={addVariableSegment}>
              Add Variable
            </Button>
          </div>
        </div>

        <div className={styles.segmentEditor}>
          <div>Mad Lib Segments</div>
          {data.segments.map((segment, index) => (
            <div key={segment.id} className={styles.segmentItem}>
              <div className={styles.segmentNumber}>{index + 1}</div>
              {segment.type === 'text' ? (
                <div className={styles.textSegmentEditor}>
                  <TextInput
                    label="Text"
                    value={segment.content}
                    onChange={(e) => updateSegment(index, e.target.value)}
                  />
                </div>
              ) : (
                <div className={styles.variableSegmentEditor}>
                  <div className={styles.variableInfo}>
                    <h5>
                      Variable:{' '}
                      {data.variables.find((v) => v.id === segment.content)?.name || 'Unnamed'}
                    </h5>
                  </div>
                  {(() => {
                    const variable = data.variables.find((v) => v.id === segment.content);
                    if (!variable) return null;

                    return (
                      <div className={styles.variableFields}>
                        <TextInput
                          label="Variable Name"
                          placeholder="adjective"
                          value={variable.name}
                          onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                        />
                        <TextInput
                          label="Question to ask user"
                          placeholder="Enter an adjective"
                          value={variable.question}
                          onChange={(e) =>
                            updateVariable(variable.id, { question: e.target.value })
                          }
                        />
                        <Dropdown
                          label="Data Type"
                          options={[
                            { label: 'Text', value: 'text' },
                            { label: 'Number', value: 'number' },
                            { label: 'Adjective', value: 'adjective' },
                            { label: 'Noun', value: 'noun' },
                            { label: 'Verb', value: 'verb' },
                            { label: 'Adverb', value: 'adverb' },
                          ]}
                          value={variable.dataType}
                          onChange={(value) => updateVariable(variable.id, { dataType: value })}
                        />
                        <Dropdown
                          label="Assign to participant"
                          options={[
                            { label: 'No one', value: '' },
                            { label: 'Random', value: 'random' },
                            ...getAvailableParticipants(
                              data.variables.findIndex((v) => v.id === variable.id),
                            ).map((p) => ({
                              label: p.name,
                              value: p.user_id,
                            })),
                          ]}
                          value={variable.assigned_user_id || ''}
                          onChange={(value) =>
                            updateVariable(variable.id, { assigned_user_id: value || undefined })
                          }
                        />
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className={styles.segmentActions}>
                <Button type="button" onClick={() => removeSegment(index)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
