// Disable TLS unauthorized rejection so proxy can connect to IPTV CDNs with untrusted or self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const referer = searchParams.get('referer') || '';
    const userAgent = searchParams.get('ua') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const cookie = searchParams.get('cookie') || '';
    const origin = searchParams.get('origin') || '';
    const authorization = searchParams.get('authorization') || '';

    if (!targetUrl) {
      return new Response('Missing url query parameter', { status: 400 });
    }

    let parsedTarget;
    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      return new Response('Invalid url query parameter', { status: 400 });
    }
    if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
      return new Response('Unsupported protocol', { status: 400 });
    }

    const isBili =
      targetUrl.includes('bilivideo.com') ||
      targetUrl.includes('akamaized.net') ||
      targetUrl.includes('bstarstatic.com') ||
      targetUrl.includes('bilibili.');

    let effectiveUserAgent = userAgent;
    let effectiveReferer = referer;

    if (isBili) {
      effectiveUserAgent = 'Bilibili Freedome/1.0.0 (Android; 13)';
      effectiveReferer = ''; // Do not send desktop referer to avoid 403 on Bilibili CDNs
    }

    const headers = {
      'User-Agent': effectiveUserAgent,
    };
    if (effectiveReferer) {
      headers['Referer'] = effectiveReferer;
      try {
        headers['Origin'] = origin || new URL(effectiveReferer).origin;
      } catch {}
    } else if (origin) {
      headers['Origin'] = origin;
    }
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    // Forward range header for video seeking support, capped to 2 MB chunks for serverless payload limits
    const range = request.headers.get('range');
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/i.exec(range.trim());
      if (match) {
        const start = Number(match[1]);
        const requestedEnd = match[2] ? Number(match[2]) : null;
        const maxChunk = 2 * 1024 * 1024;
        const cappedEnd = requestedEnd !== null
          ? Math.min(requestedEnd, start + maxChunk - 1)
          : start + maxChunk - 1;
        headers['Range'] = `bytes=${start}-${cappedEnd}`;
      } else {
        headers['Range'] = range;
      }
    }

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(targetUrl, {
        headers,
        redirect: 'follow',
        cache: 'no-store',
      });
    } catch (fetchErr) {
      console.warn('Stream proxy upstream connection error:', fetchErr.message);
      return new Response(JSON.stringify({ error: 'channel_offline', message: 'Saluran saat ini sedang offline' }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Stream-Offline': 'true',
        },
      });
    }

    const contentType = upstreamResponse.headers.get('content-type') || 'application/octet-stream';
    const responseHeaders = new Headers();

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Access-Control-Expose-Headers', 'X-Stream-Url');
    responseHeaders.set('X-Stream-Url', upstreamResponse.url || targetUrl);

    if (!upstreamResponse.ok && upstreamResponse.status >= 400) {
      return new Response(JSON.stringify({ error: 'channel_offline', status: upstreamResponse.status }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Stream-Offline': 'true',
        },
      });
    }

    const isM3u8 =
      targetUrl.toLowerCase().includes('.m3u8') ||
      contentType.toLowerCase().includes('application/vnd.apple.mpegurl') ||
      contentType.toLowerCase().includes('application/x-mpegurl');

    const isMpd =
      targetUrl.toLowerCase().includes('.mpd') ||
      contentType.toLowerCase().includes('application/dash+xml') ||
      contentType.toLowerCase().includes('video/vnd.mpeg.dash.mpd');

    // If HLS playlist, rewrite all relative/absolute segment, media, map, and key URLs to go through proxy
    if (isM3u8) {
      const text = await upstreamResponse.text();
      const parentUrl = new URL(upstreamResponse.url || targetUrl);

      const toProxyUrl = (rawUri) => {
        const absUrl = new URL(rawUri, parentUrl).toString();
        const p = new URLSearchParams();
        p.set('url', absUrl);
        if (referer) p.set('referer', referer);
        if (userAgent) p.set('ua', userAgent);
        if (cookie) p.set('cookie', cookie);
        if (origin) p.set('origin', origin);
        if (authorization) p.set('authorization', authorization);
        return `/api/stream?${p.toString()}`;
      };

      const lines = text.split('\n');
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Rewrite URI="..." inside HLS tags (#EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA, etc.)
        if (trimmed.startsWith('#')) {
          if (!/URI=(["'])([^"']+)\1/.test(trimmed)) return line;
          return trimmed.replace(/URI=(["'])([^"']+)\1/g, (match, quote, uri) => {
            try {
              return `URI=${quote}${toProxyUrl(uri)}${quote}`;
            } catch {
              return match;
            }
          });
        }

        // Rewrite media chunk segment or child playlist URL
        try {
          return toProxyUrl(trimmed);
        } catch {
          return line;
        }
      });

      const rewrittenContent = rewrittenLines.join('\n');
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      responseHeaders.set('Content-Length', Buffer.byteLength(rewrittenContent).toString());

      return new Response(rewrittenContent, {
        status: 200,
        headers: responseHeaders,
      });
    }

    if (isMpd) {
      responseHeaders.set('Content-Type', 'application/dash+xml');
    } else {
      responseHeaders.set('Content-Type', contentType);
    }

    const acceptRanges = upstreamResponse.headers.get('accept-ranges');
    if (acceptRanges) responseHeaders.set('Accept-Ranges', acceptRanges);

    const contentRange = upstreamResponse.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Stream proxy error:', err);
    return new Response(`Proxy Error: ${err.message}`, { status: 502 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
