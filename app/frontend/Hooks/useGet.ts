import { useEffect, useState } from 'react';

import { useQuery } from './useQuery';

export function useGet<T>({ url, enabled }: { url: string; enabled?: boolean }) {
  const [data, setData] = useState<T>();
  const { query, ...rest } = useQuery<T>({ url });

  const get = async () => query({ method: 'GET' });

  useEffect(() => {
    if (!enabled) return;

    (async () => {
      const data = await get();
      setData(data);
    })();
  }, [url, enabled]);

  return {
    data,
    get,
    ...rest,
  };
}
