import { useCallback, useEffect, useState } from 'react';

import { useQuery } from './useQuery';

export function useGet<T>({ url, enabled }: { url: string; enabled?: boolean }) {
  const [data, setData] = useState<T>();
  const { query, abort, ...rest } = useQuery<T>({ url });

  const get = useCallback(async () => query({ method: 'GET' }), [query]);

  useEffect(() => {
    if (!enabled) return;

    (async () => {
      const data = await get();
      setData(data);
    })();

    return () => abort();
  }, [url, enabled, get, abort]);

  return {
    data,
    get,
    ...rest,
  };
}
