function decodeBase64Json(b64) {
  try {
    const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const str =
      typeof window !== 'undefined'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function buildWatchUrl(video, episode = null, seasonName = null) {
  if (!video) return '/';

  const params = new URLSearchParams();
  params.set('model_id', String(video.modelId || ''));
  params.set('id', String(video.id || ''));

  if (video.title) params.set('title', video.title);
  if (video.poster) params.set('poster', video.poster);
  if (video.type) params.set('type', video.type);

  if (episode && episode.id) {
    params.set('episode_id', String(episode.id));
    if (episode.num) params.set('ep', String(episode.num));
  } else if (video.modelId === 'CineTv' || String(video.id).startsWith('bittvd_')) {
    if (String(video.id).startsWith('bittvd_')) {
      const json = decodeBase64Json(String(video.id).substring(7));
      if (json?.cc && json?.cid) {
        params.set('episode_id', `bittv:${json.cc}:${json.cid}`);
      }
    }
    params.set('type', 'live');
  }
  if (seasonName) params.set('season', seasonName);

  return `/watch?${params.toString()}`;
}
