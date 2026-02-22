import { useQuery } from './useQuery';

export function usePost<T>({ url }: { url: string }) {
  const { query, ...rest } = useQuery<T>({ url });

  const post = async (body: Record<string, unknown> | BodyInit) => {
    const serialized =
      typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) &&
      !(body instanceof ReadableStream)
        ? JSON.stringify(body)
        : (body as BodyInit);

    return query({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
    });
  };

  return {
    post,
    ...rest,
  };
}
