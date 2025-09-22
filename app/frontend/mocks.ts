import { MultistepFormBlock, PollBlock, QuestionBlock } from './types';

export const MOCK_POLL_BLOCK: PollBlock = {
  type: 'poll',
  question: 'What is your favorite color?',
  options: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'],
  pollType: 'single',
};

export const MOCK_QUESTION_BLOCK: QuestionBlock = {
  type: 'question',
  question: 'What is your favorite color?',
  formKey: 'favorite_color',
};

export const MOCK_MULTISTEP_FORM_BLOCK: MultistepFormBlock = {
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
