'use client';

const KEY_PROGRESS = 'cinebox_playback_progress';

export function saveProgress(videoId, episodeId, currentTime, duration) {
  if (
    !videoId ||
    typeof window === 'undefined' ||
    !Number.isFinite(currentTime) ||
    currentTime < 0 ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) return;

  try {
    const raw = localStorage.getItem(KEY_PROGRESS);
    let parsed;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    const store = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    const key = episodeId ? `${videoId}_${episodeId}` : videoId;
    store[key] = {
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      updatedAt: Date.now()
    };
    const keys = Object.keys(store);
    if (keys.length > 100) {
      delete store[keys[0]];
    }
    localStorage.setItem(KEY_PROGRESS, JSON.stringify(store));
  } catch {}
}

export function getProgress(videoId, episodeId) {
  if (!videoId || typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(KEY_PROGRESS);
    if (!raw) return 0;
    const store = JSON.parse(raw);
    const key = episodeId ? `${videoId}_${episodeId}` : videoId;
    const entry = store[key];
    if (!entry || !Number.isFinite(entry.currentTime) || entry.currentTime < 0) return 0;
    if (entry.duration && entry.currentTime / entry.duration > 0.92) {
      return 0;
    }
    return entry.currentTime;
  } catch {
    return 0;
  }
}
