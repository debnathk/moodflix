import React, { useState, useEffect } from 'react';
import { getMovieDetails } from '../services/api';
import WatchlistButton from './WatchlistButton';

function MovieDetailModal({ movie, onClose, onRequireAuth, onSelectMovie }) {
  const [details, setDetails] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (movie?.id) {
      fetchMovieDetails();
    }
  }, [movie?.id]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMovieDetails(movie.id);
      if (data.success) {
        setDetails(data.movie);
        setSimilarMovies(data.similarMovies || []);
      } else {
        setError('Failed to load movie details');
      }
    } catch (err) {
      console.error('Error fetching movie details:', err);
      setError('Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  const handleSimilarMovieClick = (similarMovie) => {
    if (onSelectMovie) {
      onSelectMovie(similarMovie);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const movieData = details || movie;
  const backdropUrl = movieData?.backdrop_path || movieData?.poster_path;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-4xl my-8 mx-4 bg-dark-400 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Hero Section with Backdrop */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={movieData?.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-dark-400/50 to-transparent" />
          
          {/* Movie Title & Quick Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end gap-4">
              {/* Poster Thumbnail */}
              {movieData?.poster_path && (
                <img
                  src={movieData.poster_path}
                  alt={movieData.title}
                  className="hidden md:block w-24 h-36 object-cover rounded-lg shadow-lg"
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{movieData?.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  {movieData?.year && <span>{movieData.year}</span>}
                  {details?.runtime && (
                    <>
                      <span>•</span>
                      <span>{Math.floor(details.runtime / 60)}h {details.runtime % 60}m</span>
                    </>
                  )}
                  {(movieData?.vote_average || movieData?.rating) && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {movieData.vote_average || movieData.rating}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">{error}</div>
          ) : (
            <>
              {/* Actions */}
              <div className="flex items-center gap-3 mb-6">
                <WatchlistButton 
                  movie={movieData} 
                  onRequireAuth={onRequireAuth}
                  size="lg"
                />
                <a
                  href={`https://www.themoviedb.org/movie/${movieData?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-100 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on TMDB
                </a>
              </div>

              {/* Genres */}
              {movieData?.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {movieData.genres.map((genre, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-primary-500/20 text-primary-400 text-sm rounded-full"
                    >
                      {typeof genre === 'string' ? genre : genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Tagline */}
              {details?.tagline && (
                <p className="text-lg text-slate-400 italic mb-4">"{details.tagline}"</p>
              )}

              {/* Overview */}
              {movieData?.overview && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                  <p className="text-slate-300 leading-relaxed">{movieData.overview}</p>
                </div>
              )}

              {/* Cast */}
              {details?.cast?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Cast</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {details.cast.map((person, idx) => (
                      <div key={idx} className="flex-shrink-0 text-center w-20">
                        {person.profile_path ? (
                          <img
                            src={person.profile_path}
                            alt={person.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-dark-200 flex items-center justify-center mx-auto mb-2">
                            <svg className="w-8 h-8 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <p className="text-xs text-white font-medium truncate">{person.name}</p>
                        <p className="text-xs text-slate-500 truncate">{person.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Director */}
              {details?.director && (
                <div className="mb-6">
                  <span className="text-slate-400">Director: </span>
                  <span className="text-white font-medium">{details.director}</span>
                </div>
              )}

              {/* Similar Movies - Netflix Style */}
              {similarMovies.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">More Like This</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {similarMovies.map((similar) => (
                      <div
                        key={similar.id}
                        onClick={() => handleSimilarMovieClick(similar)}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                          {similar.poster_path ? (
                            <img
                              src={similar.poster_path}
                              alt={similar.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-dark-200 flex items-center justify-center">
                              <svg className="w-8 h-8 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <svg 
                              className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-sm text-white font-medium truncate group-hover:text-primary-400 transition-colors">
                          {similar.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {similar.year && <span>{similar.year}</span>}
                          {similar.vote_average && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {similar.vote_average}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovieDetailModal;
