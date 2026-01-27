import React, { useState, useEffect } from 'react';
import { getWatchlist, removeFromWatchlist, updateWatchlistItem, addTagToWatchlistItem, removeTagFromWatchlistItem } from '../services/api';

function Watchlist({ onClose }) {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ tags: [], genres: [] });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState({ type: null, value: null });
  const [sortBy, setSortBy] = useState('addedAt');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchWatchlist();
  }, [activeFilter, sortBy, statusFilter]);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const params = { sort: sortBy };
      if (activeFilter.value) params.tag = activeFilter.value;
      if (statusFilter) params.status = statusFilter;
      
      const data = await getWatchlist(params);
      setItems(data.items);
      setFilters(data.filters);
    } catch (error) {
      console.error('Fetch watchlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (movieId) => {
    try {
      await removeFromWatchlist(movieId);
      setItems(items.filter(item => item.movieId !== movieId));
      if (selectedMovie?.movieId === movieId) setSelectedMovie(null);
    } catch (error) {
      console.error('Remove error:', error);
    }
  };

  const handleStatusChange = async (movieId, status) => {
    try {
      await updateWatchlistItem(movieId, { status });
      setItems(items.map(item => 
        item.movieId === movieId ? { ...item, status } : item
      ));
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleAddTag = async (movieId) => {
    if (!newTag.trim()) return;
    try {
      const result = await addTagToWatchlistItem(movieId, 'custom', newTag.trim());
      setItems(items.map(item => 
        item.movieId === movieId ? result.item : item
      ));
      setNewTag('');
      fetchWatchlist(); // Refresh filters
    } catch (error) {
      console.error('Add tag error:', error);
    }
  };

  const handleRemoveTag = async (movieId, type, value) => {
    try {
      const result = await removeTagFromWatchlistItem(movieId, type, value);
      setItems(items.map(item => 
        item.movieId === movieId ? result.item : item
      ));
      fetchWatchlist(); // Refresh filters
    } catch (error) {
      console.error('Remove tag error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'watched': return 'bg-green-500/20 text-green-400';
      case 'watching': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getTagColor = (type) => {
    switch (type) {
      case 'genre': return 'bg-purple-500/20 text-purple-400';
      case 'artist': return 'bg-pink-500/20 text-pink-400';
      case 'mood': return 'bg-orange-500/20 text-orange-400';
      case 'decade': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-300 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">My Watchlist</h2>
              <p className="text-xs text-slate-400">{items.length} movies saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-dark-200 flex flex-wrap items-center gap-3">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-dark-200 border border-dark-100 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="addedAt">Recently Added</option>
            <option value="title">Title</option>
            <option value="rating">Rating</option>
            <option value="year">Year</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-dark-200 border border-dark-100 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="want_to_watch">Want to Watch</option>
            <option value="watching">Watching</option>
            <option value="watched">Watched</option>
          </select>

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-2">
            {activeFilter.value && (
              <button
                onClick={() => setActiveFilter({ type: null, value: null })}
                className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs flex items-center gap-1"
              >
                {activeFilter.value}
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-lg font-medium">Your watchlist is empty</p>
              <p className="text-sm">Add movies from recommendations to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.movieId}
                  className="bg-dark-200 rounded-xl overflow-hidden hover:ring-2 hover:ring-primary-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedMovie(selectedMovie?.movieId === item.movieId ? null : item)}
                >
                  <div className="flex gap-3 p-3">
                    {/* Poster */}
                    <img
                      src={item.poster_path || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzFhMjIzNCIvPjwvc3ZnPg=='}
                      alt={item.title}
                      className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        {item.year && <span>{item.year}</span>}
                        {item.vote_average && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {item.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <select
                        value={item.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(item.movieId, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`mt-2 px-2 py-0.5 rounded text-xs ${getStatusColor(item.status)} bg-opacity-20 border-0 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                      >
                        <option value="want_to_watch">Want to Watch</option>
                        <option value="watching">Watching</option>
                        <option value="watched">Watched</option>
                      </select>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.movieId);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors self-start"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Tags */}
                  <div className="px-3 pb-3 flex flex-wrap gap-1">
                    {item.tags.slice(0, 5).map((tag, idx) => (
                      <span
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter({ type: tag.type, value: tag.value });
                        }}
                        className={`px-2 py-0.5 rounded-full text-xs cursor-pointer hover:opacity-80 ${getTagColor(tag.type)}`}
                      >
                        {tag.value}
                      </span>
                    ))}
                    {item.tags.length > 5 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-500/20 text-slate-400">
                        +{item.tags.length - 5}
                      </span>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {selectedMovie?.movieId === item.movieId && (
                    <div className="px-3 pb-3 border-t border-dark-100 pt-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      {/* All Tags */}
                      <div className="mb-3">
                        <p className="text-xs text-slate-400 mb-2">Tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getTagColor(tag.type)}`}
                            >
                              {tag.value}
                              {tag.type === 'custom' && (
                                <button
                                  onClick={() => handleRemoveTag(item.movieId, tag.type, tag.value)}
                                  className="hover:text-white"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Add Custom Tag */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag(item.movieId)}
                          placeholder="Add custom tag..."
                          className="flex-1 px-3 py-1.5 bg-dark-300 border border-dark-100 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <button
                          onClick={() => handleAddTag(item.movieId)}
                          className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs hover:bg-primary-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Watchlist;
