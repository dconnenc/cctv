import { useState } from 'react';

export function useQuery<T>({ url }: { url: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const query = async (options: RequestInit = {}) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await fetch(url, options);
      return (await response.json()) as T;
    } catch (error) {
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    query,

    isLoading,

    error,
    setError,
  };
}
