import { useState } from 'react';

export function useFollowPerformer() {
  const [isLoading, setIsLoading] = useState(false);

  const follow = async (slug: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/performers/${slug}/follow`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } finally {
      setIsLoading(false);
    }
  };

  const unfollow = async (slug: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/performers/${slug}/follow`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } finally {
      setIsLoading(false);
    }
  };

  return { follow, unfollow, isLoading };
}
