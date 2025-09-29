import { useState } from 'react';

import { useExperience } from '@cctv/contexts';
import { Button, TextInput } from '@cctv/core';
import { useSubmitMadLibResponse } from '@cctv/hooks';

import styles from './MadLib.module.scss';

interface MadLibProps {
  blockId: string;
  template: string;
  variables: Array<{
    id: string;
    name: string;
    assigned_user_id?: string;
  }>;
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
  template,
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
  const userVariable = variables.find(
    (variable) => variable.assigned_user_id === participant?.user_id,
  );

  // Check if user has already responded
  const hasResponded = responses?.user_responded || false;
  const userResponse = responses?.user_response?.answer;

  // Render the template with filled-in responses
  const renderTemplate = () => {
    let renderedTemplate = template;

    variables.forEach((variable) => {
      const placeholder = `{{${variable.name}}}`;
      const variableResponse = getVariableResponse(variable.id);

      if (variableResponse) {
        renderedTemplate = renderedTemplate.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          `<strong>${variableResponse}</strong>`,
        );
      } else {
        renderedTemplate = renderedTemplate.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          `<em>_____</em>`,
        );
      }
    });

    return renderedTemplate;
  };

  // Get the response for a specific variable
  const getVariableResponse = (variableId: string): string | null => {
    // First check if we have all responses (for rendering filled template)
    if (responses?.all_responses && responses.all_responses[variableId]) {
      return responses.all_responses[variableId];
    }

    // Fallback to user's own response if it matches the variable
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
        <div dangerouslySetInnerHTML={{ __html: renderTemplate() }} />
      </div>

      {userVariable && !hasResponded && !disabled && (
        <div className={styles.inputSection}>
          <h3>Your turn!</h3>
          <p>
            Please provide a word for: <strong>{userVariable.name}</strong>
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
            ✅ You've submitted your word: <strong>{userResponse?.value}</strong>
          </p>
        </div>
      )}

      {!userVariable && (
        <div className={styles.waiting}>
          <p>Waiting for others to fill in their words...</p>
          <p>
            Responses: {responses?.total || 0} / {variables.length}
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
