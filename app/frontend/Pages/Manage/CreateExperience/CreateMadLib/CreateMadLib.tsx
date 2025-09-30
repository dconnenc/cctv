import { Button, TextInput } from '@cctv/core';
import { Dropdown } from '@cctv/core/Dropdown/Dropdown';

import { BlockComponentProps, MadLibData } from '../types';

import styles from './CreateMadLib.module.scss';

export default function CreateMadLib({
  data,
  onChange,
  participants = [],
}: BlockComponentProps<MadLibData>) {
  const updateData = (updates: Partial<MadLibData>) => {
    onChange?.(updates);
  };

  const addTextSegment = () => {
    const newId = Date.now().toString();
    updateData({
      segments: [...data.segments, { id: newId, type: 'text', content: ' ' }],
    });
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

    updateData({
      variables: [...data.variables, newVariable],
      segments: [...data.segments, newSegment],
    });
  };

  const updateSegment = (index: number, content: string) => {
    const newSegments = [...data.segments];
    newSegments[index] = { ...newSegments[index], content };
    updateData({ segments: newSegments });
  };

  const removeSegment = (index: number) => {
    const segment = data.segments[index];
    const newSegments = data.segments.filter((_, i) => i !== index);

    let newVariables = data.variables;
    if (segment.type === 'variable') {
      newVariables = data.variables.filter((v) => v.id !== segment.content);
    }

    updateData({
      segments: newSegments,
      variables: newVariables,
    });
  };

  const updateVariable = (variableId: string, updates: any) => {
    const newVariables = data.variables.map((v) =>
      v.id === variableId ? { ...v, ...updates } : v,
    );
    updateData({ variables: newVariables });
  };

  return (
    <div className={styles.details}>
      <div className={styles.madLibBuilder}>
        <div className={styles.builderSection}>
          <h3>Mad Lib Builder</h3>
          <div className={styles.preview}>
            {data.segments.map((segment, index) => (
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
            <Button type="button" onClick={addTextSegment}>
              Add Text
            </Button>
            <Button type="button" onClick={addVariableSegment}>
              Add Variable
            </Button>
          </div>
        </div>

        <div className={styles.segmentEditor}>
          <h4>Mad Lib Segments</h4>
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
                            { label: 'Unassigned', value: '' },
                            { label: 'Random Assignment', value: 'random' },
                            ...participants
                              .filter((p) => {
                                const isAlreadyAssigned = data.variables.some(
                                  (v) => v.id !== variable.id && v.assigned_user_id === p.user_id,
                                );
                                return !isAlreadyAssigned;
                              })
                              .map((p) => ({
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
