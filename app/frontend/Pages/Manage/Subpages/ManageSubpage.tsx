import { ReactNode } from 'react';

import { useNavigate } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core';

import styles from './ManageSubpage.module.scss';

interface ManageSubpageProps {
  title: string;
  children: ReactNode;
}

export default function ManageSubpage({ title, children }: ManageSubpageProps) {
  const navigate = useNavigate();
  const { code, isLoading, wsReady } = useExperience();

  if (isLoading || !wsReady) {
    return <section className="page flex-centered">Loading...</section>;
  }

  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <Button
          variant="ghost"
          onClick={() => navigate(`/experiences/${code}/manage/focus`)}
          title="Back to focus mode"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </Button>
        <h1 className={styles.title}>{title}</h1>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
