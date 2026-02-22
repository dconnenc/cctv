import { useCallback, useRef, useState } from 'react';

export function useQuery<T>({ url }: { url: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const abortControllerRef = useRef<AbortController>(undefined);

  const query = useCallback(
    async (options: RequestInit = {}): Promise<T | undefined> => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(undefined);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return (await response.json()) as T;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return undefined;
        setError(err instanceof Error ? err.message : 'Unknown error');
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [url],
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    query,
    abort,
    isLoading,
    error,
    setError,
  };
}
