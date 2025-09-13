export interface Participant {
  id: string;
  name: string;
}

export interface PollExperience {
  type: 'poll';
  question: string;
  options: string[];
  pollType: 'single' | 'multiple';
}

export type Experience = PollExperience;
