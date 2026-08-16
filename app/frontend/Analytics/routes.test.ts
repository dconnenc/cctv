import { describe, expect, it } from 'vitest';

import { apiPathPattern, routePattern } from './routes';

describe('routePattern', () => {
  it('collapses experience codes so pages group across shows', () => {
    expect(routePattern('/experiences/yay-pie')).toBe('/experiences/:code');
    expect(routePattern('/experiences/bear-down')).toBe('/experiences/:code');
  });

  it('distinguishes nested experience routes from the index', () => {
    expect(routePattern('/experiences/yay-pie/manage')).toBe('/experiences/:code/manage');
    expect(routePattern('/experiences/yay-pie/avatar')).toBe('/experiences/:code/avatar');
    expect(routePattern('/experiences/yay-pie/monitor')).toBe('/experiences/:code/monitor');
  });

  it('separates the new-block route from a specific block', () => {
    expect(routePattern('/experiences/yay-pie/manage/blocks/new')).toBe(
      '/experiences/:code/manage/blocks/new',
    );
    expect(routePattern('/experiences/yay-pie/manage/blocks/abc-123')).toBe(
      '/experiences/:code/manage/blocks/:blockId',
    );
  });

  it('collapses slugs on events and performers', () => {
    expect(routePattern('/events/pie-day')).toBe('/events/:slug');
    expect(routePattern('/events/new')).toBe('/events/new');
    expect(routePattern('/performers/some-name/edit')).toBe('/performers/:slug/edit');
  });

  it('passes through static routes and tolerates trailing slashes', () => {
    expect(routePattern('/')).toBe('/');
    expect(routePattern('/join')).toBe('/join');
    expect(routePattern('/experiences/yay-pie/')).toBe('/experiences/:code');
  });
});

describe('apiPathPattern', () => {
  it('collapses experience and block identifiers', () => {
    expect(apiPathPattern('/api/experiences/yay-pie/blocks/abc-123/submit_question_response')).toBe(
      '/api/experiences/:code/blocks/:blockId/submit_question_response',
    );
  });

  it('drops query strings and accepts absolute urls', () => {
    expect(apiPathPattern('/api/experiences/yay-pie?full=true')).toBe('/api/experiences/:code');
    expect(apiPathPattern('https://example.com/api/performers/jane')).toBe('/api/performers/:slug');
  });
});
