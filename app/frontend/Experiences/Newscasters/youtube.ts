// Extracts an 11-character YouTube video id from the common URL shapes.
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function youtubeEmbedUrl(url: string, playing: boolean): string | null {
  const id = extractYoutubeId(url);
  if (!id) return null;

  const params = new URLSearchParams({
    autoplay: playing ? '1' : '0',
    controls: '0',
    loop: '1',
    playlist: id,
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
