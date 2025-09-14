import { useQuery } from './useQuery';

export function usePost<T>({ url }: { url: string }) {
  const { query, ...rest } = useQuery<T>({ url });

  const post = async (body: BodyInit) =>
    query({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });

  return {
    post,
    ...rest,
  };
}
