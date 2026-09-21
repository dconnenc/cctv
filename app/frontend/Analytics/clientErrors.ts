/**
 * A single place for "the app just broke" signals. Analytics publishes here and
 * feedback subscribes, so the reporting flow can react to render crashes and
 * server errors without analytics needing to know feedback exists.
 */
export type ClientErrorOrigin =
  | 'react_error_boundary'
  | 'window_error'
  | 'unhandled_rejection'
  | 'api_server_error';

export interface ClientErrorEvent {
  message: string;
  stack?: string;
  source: ClientErrorOrigin;
  httpStatus?: number;
  httpUrl?: string;
}

type ClientErrorListener = (event: ClientErrorEvent) => void;

const listeners = new Set<ClientErrorListener>();

export function onClientError(listener: ClientErrorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishClientError(event: ClientErrorEvent): void {
  listeners.forEach((listener) => listener(event));
}
