import { useState } from 'react';

import { ChevronDown, ChevronRight, Eye, RotateCcw, Trash2, X } from 'lucide-react';

import { Button } from '@cctv/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cctv/core/DropdownMenu/DropdownMenu';
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
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Playing Controls</span>
        <span className={styles.progress}>
          Question {gameState.current_question_index + 1} of {gameState.questions.length}
        </span>
      </div>

      <div className={styles.content}>
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
          <button
            onClick={handleShowX}
            disabled={showingX}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              showingX
                ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            <X size={16} />
            {showingX ? 'Showing X...' : 'Show X'}
          </button>

          <button
            onClick={handleNextQuestion}
            disabled={advancing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              advancing
                ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                : 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90'
            }`}
          >
            {isLastQuestion ? (
              'Close Game'
            ) : (
              <>
                Next Question <ChevronRight size={16} />
              </>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={restarting !== null}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  restarting !== null
                    ? 'text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                    : 'text-white hover:text-white hover:bg-[hsl(var(--background))]'
                }`}
              >
                <RotateCcw size={16} />
                Reset
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleRestart('playing')}
                disabled={restarting !== null}
              >
                <RotateCcw size={14} />
                <span className="ml-2">Restart Playing</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRestart('categorizing')}
                disabled={restarting !== null}
              >
                <RotateCcw size={14} />
                <span className="ml-2">Re-categorize</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleRestart('everything')}
                disabled={restarting !== null}
                className="text-red-500 focus:text-red-400"
              >
                <Trash2 size={14} />
                <span className="ml-2">Reset Everything</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
