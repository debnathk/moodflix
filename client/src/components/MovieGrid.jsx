import React from 'react';
import MovieCard from './MovieCard';

function MovieGrid({ movies, onWatchlistUpdate, onRequireAuth, onMovieClick }) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium text-slate-300">
          Recommended Movies ({movies.length})
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {movies.map((movie, index) => (
          <MovieCard 
            key={movie.id || index} 
            movie={movie} 
            onWatchlistUpdate={onWatchlistUpdate}
            onRequireAuth={onRequireAuth}
            onMovieClick={onMovieClick}
          />
        ))}
      </div>
    </div>
  );
}

export default MovieGrid;
