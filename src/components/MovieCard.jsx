'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { buildWatchUrl } from '@/lib/watch';

export default function MovieCard({ video }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const isNavigatingRef = useRef(false);

  const handleClick = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push(buildWatchUrl(video));
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1500);
  };

  const isLive = video.type === 'live' || video.type === 'live_tv' || video.modelId === 'CineTv';
  const isSeries = !isLive && (video.type === 'tv' || video.type === 'series' || video.type === 'short_drama');

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col rounded-lg overflow-hidden bg-[#131622] border border-white/5 hover:border-white/20 cursor-pointer transition-colors duration-200"
    >
      {/* Poster Container with 2:3 Aspect Ratio */}
      <div className="relative aspect-[2/3] w-full bg-[#1c2132] overflow-hidden">
        {video.poster && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.poster}
            alt={video.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#181c2b]">
            <Play className="w-8 h-8 text-white/20 mb-2" />
            <span className="text-xs text-gray-400 font-medium line-clamp-2">{video.title}</span>
          </div>
        )}

        {/* Top Type Tag */}
        <div className="absolute top-2 left-2 pointer-events-none">
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isLive
                ? 'bg-[#e50914] text-white'
                : 'bg-black/75 text-white/90'
            }`}
          >
            {isLive ? 'Live TV' : isSeries ? 'Serial' : 'Film'}
          </span>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between">
        <h3
          title={video.title}
          className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white line-clamp-2 leading-tight mb-1"
        >
          {video.title}
        </h3>

        {video.sourceName && (
          <span className="text-[11px] text-gray-500">
            {video.sourceName}
          </span>
        )}
      </div>
    </div>
  );
}
