import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.post('/api/experiences/:code/blocks/:blockId/submit_poll_response', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/experiences/:code/blocks/:blockId/submit_question_response', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/experiences/:code/blocks/:blockId/submit_multistep_form_response', () => {
    return HttpResponse.json({ success: true });
  }),
];

export const server = setupServer(...handlers);
