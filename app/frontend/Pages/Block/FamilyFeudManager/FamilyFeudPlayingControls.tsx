import { useState } from 'react';

import { ChevronRight, Eye, RotateCcw, Trash2, X } from 'lucide-react';

import { Button } from '@cctv/components/ui/button';
import { Block, FamilyFeudGameState } from '@cctv/types';

import styles from './FamilyFeudPlayingControls.module.scss';

interface FamilyFeudPlayingControlsProps {
  block: Block;
  gameState: FamilyFeudGameState;
  onRevealBucket: (questionIndex: number, bucketIndex: number) => Promise<void>;
  onShowX: () => Promise<void>;
  onNextQuestion: () => Promise<void>;
  onRestartPlaying: () => Promise<void>;
  onRestartCategorizing: () => Promise<void>;
  onRestartEverything: () => Promise<void>;
}

export default function FamilyFeudPlayingControls({
  block,
  gameState,
  onRevealBucket,
  onShowX,
  onNextQuestion,
  onRestartPlaying,
  onRestartCategorizing,
  onRestartEverything,
}: FamilyFeudPlayingControlsProps) {
  const [revealingBucket, setRevealingBucket] = useState<string | null>(null);
  const [showingX, setShowingX] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [restarting, setRestarting] = useState<string | null>(null);

  const currentQuestion = gameState.questions[gameState.current_question_index];
  const isLastQuestion = gameState.current_question_index === gameState.questions.length - 1;

  if (!currentQuestion) {
    return (
      <div className={styles.root}>
        <div className={styles.error}>No questions found in game state.</div>
      </div>
    );
  }

  const handleRevealBucket = async (bucketIndex: number) => {
    const key = `${gameState.current_question_index}-${bucketIndex}`;
    setRevealingBucket(key);
    try {
      await onRevealBucket(gameState.current_question_index, bucketIndex);
    } finally {
      setRevealingBucket(null);
    }
  };

  const handleShowX = async () => {
    setShowingX(true);
    try {
      await onShowX();
    } finally {
      setTimeout(() => setShowingX(false), 5000);
    }
  };

  const handleNextQuestion = async () => {
    setAdvancing(true);
    try {
      await onNextQuestion();
    } finally {
      setAdvancing(false);
    }
  };

  const handleRestart = async (type: 'playing' | 'categorizing' | 'everything') => {
    if (!confirm(getConfirmMessage(type))) return;

    setRestarting(type);
    try {
      if (type === 'playing') {
        await onRestartPlaying();
      } else if (type === 'categorizing') {
        await onRestartCategorizing();
      } else {
        await onRestartEverything();
      }
    } finally {
      setRestarting(null);
    }
  };

  const getConfirmMessage = (type: 'playing' | 'categorizing' | 'everything') => {
    switch (type) {
      case 'playing':
        return 'Restart to question 1 and hide all buckets? (Keeps all categorization)';
      case 'categorizing':
        return 'Reset all bucket assignments and return to categorizing? (Keeps all answers)';
      case 'everything':
        return 'Delete all answers and start over? This cannot be undone!';
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h3 className={styles.title}>Playing Controls</h3>
        <div className={styles.progress}>
          Question {gameState.current_question_index + 1} of {gameState.questions.length}
        </div>
      </div>

      <div className={styles.currentQuestion}>
        <h4 className={styles.questionText}>{currentQuestion.question_text}</h4>
      </div>

      <div className={styles.buckets}>
        {currentQuestion.buckets.map((bucket, index) => {
          const key = `${gameState.current_question_index}-${index}`;
          const isRevealing = revealingBucket === key;

          return (
            <div key={bucket.bucket_id} className={styles.bucketRow}>
              <div className={styles.bucketInfo}>
                <span className={styles.bucketName}>{bucket.bucket_name}</span>
                <span className={styles.percentage}>{bucket.percentage}%</span>
              </div>
              <Button
                variant={bucket.revealed ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleRevealBucket(index)}
                disabled={bucket.revealed || isRevealing}
              >
                <Eye size={16} />
                {bucket.revealed ? 'Revealed' : isRevealing ? 'Revealing...' : 'Reveal'}
              </Button>
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <Button variant="destructive" size="lg" onClick={handleShowX} disabled={showingX}>
          <X size={20} />
          {showingX ? 'Showing X...' : 'Show X'}
        </Button>

        <Button variant="default" size="lg" onClick={handleNextQuestion} disabled={advancing}>
          {isLastQuestion ? (
            <>Close Game</>
          ) : (
            <>
              Next Question <ChevronRight size={20} />
            </>
          )}
        </Button>
      </div>

      <div className={styles.restartSection}>
        <h4 className={styles.restartTitle}>Restart Options</h4>
        <div className={styles.restartActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestart('playing')}
            disabled={restarting !== null}
          >
            <RotateCcw size={16} />
            {restarting === 'playing' ? 'Restarting...' : 'Restart Playing'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestart('categorizing')}
            disabled={restarting !== null}
          >
            <RotateCcw size={16} />
            {restarting === 'categorizing' ? 'Restarting...' : 'Re-categorize'}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleRestart('everything')}
            disabled={restarting !== null}
          >
            <Trash2 size={16} />
            {restarting === 'everything' ? 'Resetting...' : 'Reset Everything'}
          </Button>
        </div>
      </div>
    </div>
  );
}
