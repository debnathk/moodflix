import React, { useState } from 'react';
import WatchlistButton from './WatchlistButton';

function MovieCard({ movie, onWatchlistUpdate, onRequireAuth, onMovieClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiB2aWV3Qm94PSIwIDAgMzAwIDQ1MCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9IiMxYTIyMzQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY0NzQ4YiIgZm9udC1zaXplPSI0MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPvCfjqw8L3RleHQ+PC9zdmc+';

  const handleCardClick = () => {
    if (onMovieClick) {
      onMovieClick(movie);
    }
  };

  return (
    <div 
      className="group relative bg-dark-300 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/20 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-dark-200 animate-pulse flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <img
          src={movie.poster_path || placeholderImage}
          alt={movie.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top row: Watchlist + Rating - z-50 to stay above hover overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-50">
          <WatchlistButton movie={movie} onUpdate={onWatchlistUpdate} onRequireAuth={onRequireAuth} size="sm" />
          {movie.rating && (
            <div className="flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-semibold text-white">{movie.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm truncate mb-1" title={movie.title}>
          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-400 transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {movie.title}
          </a>
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {movie.year && <span>{movie.year}</span>}
          {movie.year && movie.genres?.length > 0 && <span>•</span>}
          {movie.genres?.length > 0 && (
            <span className="truncate">{movie.genres.slice(0, 2).join(', ')}</span>
          )}
        </div>
      </div>

      {/* Hover overlay with overview - z-40 to stay below watchlist button */}
      <div className="absolute inset-0 bg-dark-400/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 pt-14 flex flex-col justify-end z-40 pointer-events-none group-hover:pointer-events-auto">
        <h3 className="font-bold text-white text-sm mb-2 line-clamp-2">
          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-400 transition-colors duration-200 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {movie.title}
          </a>
        </h3>
        {movie.overview && (
          <p className="text-xs text-slate-300 line-clamp-4 mb-3">{movie.overview}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {movie.year && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {movie.year}
            </span>
          )}
          {movie.rating && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {movie.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
