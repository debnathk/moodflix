import React, { useState, useEffect } from 'react';
import { addToWatchlist, removeFromWatchlist, checkInWatchlist } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function WatchlistButton({ movie, onUpdate, onRequireAuth, size = 'md' }) {
  const { isAuthenticated } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Only check watchlist status if user is authenticated
    if (movie?.id && isAuthenticated) {
      checkStatus();
    } else {
      setInWatchlist(false);
    }
  }, [movie?.id, isAuthenticated]);

  const checkStatus = async () => {
    try {
      const result = await checkInWatchlist(movie.id);
      setInWatchlist(result.inWatchlist);
    } catch (error) {
      // User not authenticated or other error
      setInWatchlist(false);
    }
  };

  const handleClick = async (e) => {
    e.stopPropagation();
    if (loading) return;

    // If not authenticated, prompt login
    if (!isAuthenticated) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    setLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(movie.id);
        setInWatchlist(false);
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
      } else {
        await addToWatchlist({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          overview: movie.overview,
          release_date: movie.release_date,
          year: movie.year,
          vote_average: movie.vote_average || movie.rating,
          genres: movie.genres || []
        });
        setInWatchlist(true);
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Watchlist action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'px-4 py-2 gap-2' // Larger button with text
  };

  const isLarge = size === 'lg';

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${isLarge ? sizeClasses.lg : sizeClasses[size]} ${isLarge ? 'rounded-lg' : 'rounded-full'} transition-all duration-200 flex items-center justify-center ${
          inWatchlist
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : isLarge ? 'bg-dark-200 text-white hover:bg-dark-100' : 'bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm'
        } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {loading ? (
          <svg className={isLarge ? 'w-5 h-5' : 'w-full h-full'} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25 animate-spin" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : inWatchlist ? (
          <svg className={isLarge ? 'w-5 h-5' : 'w-full h-full'} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className={isLarge ? 'w-5 h-5' : 'w-full h-full'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
        {isLarge && (
          <span className="font-medium">
            {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
          </span>
        )}
      </button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-dark-200 text-white text-xs rounded whitespace-nowrap animate-fade-in">
          {inWatchlist ? 'Added!' : 'Removed!'}
        </div>
      )}
    </div>
  );
}

export default WatchlistButton;
