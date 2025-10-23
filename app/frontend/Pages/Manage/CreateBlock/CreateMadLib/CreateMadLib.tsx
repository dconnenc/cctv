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
  parts: Array<{ id: string; type: 'text' | 'variable'; content: string }>;
  variables: MadLibVariable[];
}

export const getDefaultMadLibState = (): MadLibData => {
  return {
    parts: [],
    variables: [],
  };
};

export const validateMadLib = (data: MadLibDataInternal): string | null => {
  const validParts = data.parts.filter((s) => s.content.trim());

  if (validParts.length === 0) {
    return 'Mad lib must have at least one part';
  }

  const validVariables = data.variables.filter((v) => v.name.trim() && v.question.trim());
  const variableParts = validParts.filter((s) => s.type === 'variable');

  if (variableParts.length > 0 && validVariables.length === 0) {
    return 'Variables must have both name and question configured';
  }

  for (const part of variableParts) {
    const variable = data.variables.find((v) => v.id === part.content);
    if (!variable?.assigned_user_id) {
      return 'Each variable must have an assigned user';
    }
  }

  return null;
};

export default function CreateMadLib({ data, onChange }: BlockComponentProps<MadLibData>) {
  const { participants } = useCreateBlockContext();

  const internalData: MadLibDataInternal = {
    parts: data.parts,
    variables: data.variables || [],
  };

  const setInternalData = (newData: Partial<MadLibDataInternal>) => {
    onChange?.({ ...internalData, ...newData });
  };

  const updatePart = (index: number, content: string) => {
    const newParts = [...internalData.parts];
    newParts[index] = { ...newParts[index], content };
    setInternalData({ parts: newParts });
  };

  const addTextPart = () => {
    const newId = Date.now().toString();
    const newParts = [...internalData.parts, { id: newId, type: 'text' as const, content: ' ' }];
    setInternalData({ parts: newParts });
  };

  const addVariablePart = () => {
    const newVariableId = Date.now().toString();
    const newPartId = (Date.now() + 1).toString();

    const newVariable = {
      id: newVariableId,
      name: 'variable',
      question: 'Enter a word',
      dataType: 'text' as const,
      assigned_user_id: undefined,
    };

    const newPart = {
      id: newPartId,
      type: 'variable' as const,
      content: newVariableId,
    };

    const newData = {
      variables: [...internalData.variables, newVariable],
      parts: [...internalData.parts, newPart],
    };

    setInternalData(newData);
  };

  const removePart = (index: number) => {
    const part = internalData.parts[index];
    let newParts = internalData.parts.filter((_, i) => i !== index);

    let newVariables = internalData.variables;
    if (part.type === 'variable') {
      newVariables = internalData.variables.filter((v) => v.id !== part.content);
    }

    const combinedParts = [];
    for (let i = 0; i < newParts.length; i++) {
      const currentPart = newParts[i];

      if (currentPart.type === 'text') {
        let combinedContent = currentPart.content;
        let nextIndex = i + 1;

        while (nextIndex < newParts.length && newParts[nextIndex].type === 'text') {
          const currentEndsWithSpace = combinedContent.endsWith(' ');
          const nextStartsWithSpace = newParts[nextIndex].content.startsWith(' ');

          if (!currentEndsWithSpace && !nextStartsWithSpace) {
            combinedContent += ' ';
          }

          combinedContent += newParts[nextIndex].content;
          nextIndex++;
        }

        combinedParts.push({
          ...currentPart,
          content: combinedContent,
        });

        i = nextIndex - 1;
      } else {
        combinedParts.push(currentPart);
      }
    }

    setInternalData({
      parts: combinedParts,
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

  const canAddTextPart = () => {
    if (internalData.parts.length === 0) return true;
    const lastPart = internalData.parts[internalData.parts.length - 1];
    return lastPart.type !== 'text';
  };

  return (
    <div className={styles.details}>
      <div className={styles.madLibBuilder}>
        <div className={styles.builderSection}>
          <div>Mad Lib Builder</div>
          <div className={styles.preview}>
            {internalData.parts.map((part) => (
              <span key={part.id} className={styles.part}>
                {part.type === 'text' ? (
                  <span className={styles.textPart}>{part.content}</span>
                ) : (
                  <span className={styles.variablePart}>
                    {internalData.variables.find((v) => v.id === part.content)?.name ||
                      '[Variable]'}
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className={styles.builderControls}>
            <Button type="button" onClick={addTextPart} disabled={!canAddTextPart()}>
              Add Text
            </Button>
            <Button type="button" onClick={addVariablePart}>
              Add Variable
            </Button>
          </div>
        </div>

        <div className={styles.partEditor}>
          <div>Mad Lib Parts</div>
          {internalData.parts.map((part, index) => (
            <div key={part.id} className={styles.partItem}>
              <div className={styles.partNumber}>{index + 1}</div>
              {part.type === 'text' ? (
                <div className={styles.textPartEditor}>
                  <TextInput
                    label="Text"
                    value={part.content}
                    onChange={(e) => updatePart(index, e.target.value)}
                  />
                </div>
              ) : (
                <div className={styles.variablePartEditor}>
                  <div className={styles.variableInfo}>
                    <h5>
                      Variable:{' '}
                      {internalData.variables.find((v) => v.id === part.content)?.name || 'Unnamed'}
                    </h5>
                  </div>
                  {(() => {
                    const variable = internalData.variables.find((v) => v.id === part.content);
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
              <div className={styles.partActions}>
                <Button type="button" onClick={() => removePart(index)}>
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
