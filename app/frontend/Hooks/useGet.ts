import { useCallback, useEffect, useState } from 'react';

import { useQuery } from './useQuery';

export function useGet<T>({ url, enabled }: { url: string; enabled?: boolean }) {
  const [data, setData] = useState<T>();
  const { query, abort, ...rest } = useQuery<T>({ url });

  const get = useCallback(async () => {
    const result = await query({ method: 'GET' });
    if (result !== undefined) setData(result);
    return result;
  }, [query]);

  useEffect(() => {
    if (!enabled) return;
    void get();
    return () => abort();
  }, [url, enabled, get, abort]);

  return {
    data,
    get,
    ...rest,
  };
}
