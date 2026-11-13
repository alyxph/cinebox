  // Subtitle parser (WebVTT / SRT / ASS / Bilibili JSON)
export function parseSubtitleText(content) {
    const list = [];
    if (!content) return list;
    const clean = content.replace(/\r/g, '').trim();

    // Check if Bilibili JSON format
    if (clean.startsWith('{')) {
      try {
        const json = JSON.parse(clean);
        if (Array.isArray(json.body)) {
          for (const item of json.body) {
            const start = parseFloat(item.from || 0);
            const end = parseFloat(item.to || 0);
            const text = (item.content || '').trim();
            if (text && !isNaN(start) && !isNaN(end)) {
              list.push({ start, end, text });
            }
          }
          if (list.length > 0) return list;
        }
      } catch {}
    }

    // Check if ASS / SSA format (Bstation format)
    if (clean.includes('[Events]') || clean.includes('Dialogue:')) {
      const lines = clean.split('\n');
      for (const line of lines) {
        if (line.startsWith('Dialogue:')) {
          const parts = line.substring(9).split(',');
          if (parts.length >= 9) {
            const start = parseTimestamp(parts[1].trim());
            const end = parseTimestamp(parts[2].trim());
            const text = parts.slice(9).join(',').replace(/\{[^}]+\}/g, '').replace(/\\N/g, '\n').trim();
            if (text && !isNaN(start) && !isNaN(end)) {
              list.push({ start, end, text });
            }
          }
        }
      }
      if (list.length > 0) return list;
    }

    // Standard WebVTT / SRT parser
    const blocks = clean.split(/\n\n+/);

    for (const b of blocks) {
      const lines = b.trim().split('\n');
      if (lines.length < 2) continue;

      let timeLineIdx = lines.findIndex(l => l.includes('-->'));
      if (timeLineIdx === -1) continue;

      const [startStr, endStr] = lines[timeLineIdx].split('-->');
      if (!startStr || !endStr) continue;

      const start = parseTimestamp(startStr.trim());
      const end = parseTimestamp(endStr.trim().split(' ')[0]);

      const text = lines
        .slice(timeLineIdx + 1)
        .join('\n')
        .replace(/<[^>]+>/g, '')
        .trim();

      if (text && !isNaN(start) && !isNaN(end)) {
        list.push({ start, end, text });
      }
    }
    return list;
  }

  function parseTimestamp(t) {
    const parts = t.replace(',', '.').split(':');
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 0;
  }

