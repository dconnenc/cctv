import { MultistepFormExperience, PollExperience, QuestionExperience } from './types';

export const MOCK_POLL_EXPERIENCE: PollExperience = {
  type: 'poll',
  question: 'What is your favorite color?',
  options: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'],
  pollType: 'single',
};

export const MOCK_QUESTION_EXPERIENCE: QuestionExperience = {
  type: 'question',
  question: 'What is your favorite color?',
  formKey: 'favorite_color',
};

export const MOCK_MULTISTEP_FORM_EXPERIENCE: MultistepFormExperience = {
  type: 'multistep_form',
  questions: [
    { type: 'question', question: 'What is your favorite color?', formKey: 'favorite_color' },
    { type: 'question', question: 'What is your email?', formKey: 'email', inputType: 'email' },
    {
      type: 'question',
      question: 'What is your phone number?',
      formKey: 'phone_number',
      inputType: 'tel',
    },
  ],
};
