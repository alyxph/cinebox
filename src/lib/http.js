// The deadline includes reading the body, not just receiving response headers.
export async function fetchJson(url, { timeoutMs = 25000, signal, ...options } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    let data;
    try { data = await response.json(); }
    catch (error) {
      if (controller.signal.aborted) throw error;
      throw new Error('Server mengirim respons tidak valid. Silakan coba lagi.');
    }
    if (!response.ok || data?.success === false) {
      const error = new Error(typeof data?.error === 'string' ? data.error : 'Server sedang tidak tersedia. Silakan coba lagi.');
      error.status = response.status;
      throw error;
    }
    if (!data || typeof data !== 'object') throw new Error('Data dari server tidak valid.');
    return data;
  } catch (error) {
    if (timedOut) throw new Error('Server tidak merespons tepat waktu. Silakan coba lagi.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
