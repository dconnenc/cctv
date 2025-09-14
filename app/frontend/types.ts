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

export interface QuestionExperience {
  type: 'question';
  question: string;
  formKey: string;
  inputType?: 'text' | 'number' | 'email' | 'password' | 'tel';
}

export interface MultistepFormExperience {
  type: 'multistep_form';
  questions: QuestionExperience[];
}

export type Experience = PollExperience | QuestionExperience | MultistepFormExperience;

export interface BaseExperience {
  id: string;
  code: string;
  participant_count: number;
  created_at: string;
}

export interface ExperienceCreateResponse {
  success: boolean;
  experience: BaseExperience;
  lobby_url: string;
  error?: string;
}
