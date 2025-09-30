import { useState } from 'react';

import { useExperience } from '@cctv/contexts';
import { Button, TextInput } from '@cctv/core';
import { useSubmitMadLibResponse } from '@cctv/hooks';
import { MadLibSegment, MadLibVariable } from '@cctv/types';

import styles from './MadLib.module.scss';

interface MadLibProps {
  blockId: string;
  segments: MadLibSegment[];
  variables: MadLibVariable[];
  responses?: {
    total: number;
    user_responded: boolean;
    user_response?: {
      id: string;
      answer: any;
    } | null;
    aggregate?: Record<string, any>;
    all_responses?: Record<string, string>;
  };
  disabled?: boolean;
}

export default function MadLib({
  blockId,
  segments,
  variables,
  responses,
  disabled = false,
}: MadLibProps) {
  const { participant } = useExperience();
  const {
    submitMadLibResponse,
    isLoading: isSubmitting,
    error: submitError,
  } = useSubmitMadLibResponse();
  const [userInput, setUserInput] = useState('');

  // Find if current user has a variable assigned to them
  // This is a workaround for now as ideally this will be served from the back
  // end. There is only a "single" block representing the mad lib for now, so
  // the visibility rules mean everyone will see it.
  //
  // The future state is sub blocks that source the data for the mad libs and
  // there won't be any client side filtering
  const userVariable = variables.find(
    (variable) => variable.assigned_user_id === participant?.user_id,
  );

  const hasResponded = responses?.user_responded || false;
  const userResponse = responses?.user_response?.answer;

  const renderMadLib = () => {
    return segments
      .map((segment) => {
        if (segment.type === 'text') {
          return segment.content;
        } else {
          // This is a variable segment
          const variable = variables.find((v) => v.id === segment.content);
          const variableResponse = getVariableResponse(segment.content);

          if (variableResponse) {
            return `<strong>${variableResponse}</strong>`;
          } else {
            return `<em>_____</em>`;
          }
        }
      })
      .join('');
  };

  const getVariableResponse = (variableId: string): string | null => {
    if (responses?.all_responses && responses.all_responses[variableId]) {
      return responses.all_responses[variableId];
    }

    if (userVariable?.id === variableId && userResponse?.value) {
      return userResponse.value;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!userVariable || !userInput.trim() || disabled) return;

    const result = await submitMadLibResponse({
      blockId,
      answer: {
        variable_id: userVariable.id,
        value: userInput.trim(),
      },
    });

    if (result?.success) {
      setUserInput('');
    }
  };

  return (
    <div className={styles.madLib}>
      <div className={styles.template}>
        <div dangerouslySetInnerHTML={{ __html: renderMadLib() }} />
      </div>

      {userVariable && !hasResponded && !disabled && (
        <div className={styles.inputSection}>
          <p>
            <strong>{userVariable.question}</strong>
          </p>
          <div className={styles.inputGroup}>
            <TextInput
              label=""
              placeholder={`Enter ${userVariable.name}...`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isSubmitting}
            />
            <Button
              onClick={handleSubmit}
              disabled={!userInput.trim() || isSubmitting}
              loading={isSubmitting}
              loadingText="Submitting..."
            >
              Submit
            </Button>
          </div>
        </div>
      )}

      {userVariable && hasResponded && (
        <div className={styles.submitted}>
          <p>
            You've submitted your word: <strong>{userResponse?.value}</strong>
          </p>
        </div>
      )}

      {submitError && (
        <div className={styles.error}>
          <p>Error: {submitError}</p>
        </div>
      )}
    </div>
  );
}
