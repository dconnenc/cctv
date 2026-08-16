/**
 * Maps a concrete pathname to the route pattern that produced it.
 *
 * Raw URLs carry experience codes, slugs and block ids, so grouping pageviews by
 * `$current_url` yields one bucket per show rather than one per page. Every event
 * carries the pattern as a super property (`route`) so "what pages do users land
 * on" is a single breakdown.
 */
const ROUTE_PATTERNS: Array<[RegExp, string]> = [
  [/^\/experiences\/[^/]+\/manage\/blocks\/new$/, '/experiences/:code/manage/blocks/new'],
  [/^\/experiences\/[^/]+\/manage\/blocks\/[^/]+$/, '/experiences/:code/manage/blocks/:blockId'],
  [/^\/experiences\/[^/]+\/manage$/, '/experiences/:code/manage'],
  [/^\/experiences\/[^/]+\/register$/, '/experiences/:code/register'],
  [/^\/experiences\/[^/]+\/monitor$/, '/experiences/:code/monitor'],
  [/^\/experiences\/[^/]+\/avatar$/, '/experiences/:code/avatar'],
  [/^\/experiences\/[^/]+\/playbill$/, '/experiences/:code/playbill'],
  [/^\/experiences\/[^/]+\/timeline$/, '/experiences/:code/timeline'],
  [/^\/experiences\/[^/]+$/, '/experiences/:code'],
  [/^\/events\/new$/, '/events/new'],
  [/^\/events\/[^/]+\/edit$/, '/events/:slug/edit'],
  [/^\/events\/[^/]+$/, '/events/:slug'],
  [/^\/performers\/new$/, '/performers/new'],
  [/^\/performers\/[^/]+\/edit$/, '/performers/:slug/edit'],
  [/^\/performers\/[^/]+$/, '/performers/:slug'],
];

export function routePattern(pathname: string): string {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const match = ROUTE_PATTERNS.find(([pattern]) => pattern.test(normalized));
  return match ? match[1] : normalized;
}

/**
 * Collapses an API path the same way, so request timing and failures group by
 * endpoint instead of by experience.
 */
export function apiPathPattern(url: string): string {
  const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];
  return path
    .replace(/\/experiences\/[^/]+/, '/experiences/:code')
    .replace(/\/blocks\/[^/]+/, '/blocks/:blockId')
    .replace(/\/participants\/[^/]+/, '/participants/:id')
    .replace(/\/performers\/[^/]+/, '/performers/:slug')
    .replace(/\/events\/[^/]+/, '/events/:slug');
}
