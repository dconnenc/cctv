import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core';
import { BlockKind, BlockStatus, ParticipantSummary } from '@cctv/types';
import { BlockComponentProps, MadLibData } from '@cctv/types';

import { useCreateBlockContext } from '../CreateBlockContext';

import styles from './CreateMadLib.module.scss';

interface MadLibVariable {
  id: string;
  name: string;
  question: string;
  dataType: 'text' | 'number';
  assigned_user_id?: string;
}

interface MadLibDataInternal {
  segments: Array<{ id: string; type: 'text' | 'variable'; content: string }>;
  variables: MadLibVariable[];
}

export const getDefaultMadLibState = (): MadLibData => {
  return {
    segments: [],
  };
};

export const validateMadLib = (data: MadLibDataInternal): string | null => {
  const validSegments = data.segments.filter((s) => s.content.trim());

  if (validSegments.length === 0) {
    return 'Mad lib must have at least one segment';
  }

  const validVariables = data.variables.filter((v) => v.name.trim() && v.question.trim());
  const variableSegments = validSegments.filter((s) => s.type === 'variable');

  if (variableSegments.length > 0 && validVariables.length === 0) {
    return 'Variables must have both name and question configured';
  }

  for (const segment of variableSegments) {
    const variable = data.variables.find((v) => v.id === segment.content);
    if (!variable?.assigned_user_id) {
      return 'Each variable must have an assigned user';
    }
  }

  return null;
};

export default function CreateMadLib({ data, onChange }: BlockComponentProps<MadLibData>) {
  const { participants } = useCreateBlockContext();

  const internalData: MadLibDataInternal = {
    segments: data.segments,
    variables: (data as any).variables || [],
  };

  const setInternalData = (newData: Partial<MadLibDataInternal>) => {
    onChange?.({ ...data, ...newData } as any);
  };

  const updateSegment = (index: number, content: string) => {
    const newSegments = [...internalData.segments];
    newSegments[index] = { ...newSegments[index], content };
    setInternalData({ segments: newSegments });
  };

  const addTextSegment = () => {
    const newId = Date.now().toString();
    const newSegments = [
      ...internalData.segments,
      { id: newId, type: 'text' as const, content: ' ' },
    ];
    setInternalData({ segments: newSegments });
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
      variables: [...internalData.variables, newVariable],
      segments: [...internalData.segments, newSegment],
    };

    setInternalData(newData);
  };

  const removeSegment = (index: number) => {
    const segment = internalData.segments[index];
    let newSegments = internalData.segments.filter((_, i) => i !== index);

    let newVariables = internalData.variables;
    if (segment.type === 'variable') {
      newVariables = internalData.variables.filter((v) => v.id !== segment.content);
    }

    const combinedSegments = [];
    for (let i = 0; i < newSegments.length; i++) {
      const currentSegment = newSegments[i];

      if (currentSegment.type === 'text') {
        let combinedContent = currentSegment.content;
        let nextIndex = i + 1;

        while (nextIndex < newSegments.length && newSegments[nextIndex].type === 'text') {
          const currentEndsWithSpace = combinedContent.endsWith(' ');
          const nextStartsWithSpace = newSegments[nextIndex].content.startsWith(' ');

          if (!currentEndsWithSpace && !nextStartsWithSpace) {
            combinedContent += ' ';
          }

          combinedContent += newSegments[nextIndex].content;
          nextIndex++;
        }

        combinedSegments.push({
          ...currentSegment,
          content: combinedContent,
        });

        i = nextIndex - 1;
      } else {
        combinedSegments.push(currentSegment);
      }
    }

    setInternalData({
      segments: combinedSegments,
      variables: newVariables,
    });
  };

  const updateVariable = (variableId: string, updates: any) => {
    const newVariables = internalData.variables.map((v) =>
      v.id === variableId ? { ...v, ...updates } : v,
    );

    setInternalData({ variables: newVariables });
  };

  const getAvailableParticipants = (excludeVariableIndex?: number) => {
    return participants.filter((p) => {
      const isAlreadyAssigned = internalData.variables.some(
        (v, vIndex) => vIndex !== excludeVariableIndex && v.assigned_user_id === p.user_id,
      );
      return !isAlreadyAssigned;
    });
  };

  const canAddTextSegment = () => {
    if (internalData.segments.length === 0) return true;
    const lastSegment = internalData.segments[internalData.segments.length - 1];
    return lastSegment.type !== 'text';
  };

  return (
    <div className={styles.details}>
      <div className={styles.madLibBuilder}>
        <div className={styles.builderSection}>
          <div>Mad Lib Builder</div>
          <div className={styles.preview}>
            {internalData.segments.map((segment) => (
              <span key={segment.id} className={styles.segment}>
                {segment.type === 'text' ? (
                  <span className={styles.textSegment}>{segment.content}</span>
                ) : (
                  <span className={styles.variableSegment}>
                    {internalData.variables.find((v) => v.id === segment.content)?.name ||
                      '[Variable]'}
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
          {internalData.segments.map((segment, index) => (
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
                      {internalData.variables.find((v) => v.id === segment.content)?.name ||
                        'Unnamed'}
                    </h5>
                  </div>
                  {(() => {
                    const variable = internalData.variables.find((v) => v.id === segment.content);
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
                          ]}
                          value={variable.dataType}
                          onChange={(value) => updateVariable(variable.id, { dataType: value })}
                        />
                        <Dropdown
                          label="Assign to participant"
                          options={[
                            { label: 'No one', value: '' },
                            ...getAvailableParticipants(
                              internalData.variables.findIndex((v) => v.id === variable.id),
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
