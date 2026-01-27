import Watchlist from '../models/Watchlist.js';

// Helper to get userId filter - user is always authenticated
const getUserFilter = (req) => {
  return { userId: req.user._id };
};

/**
 * Get all watchlist items
 * GET /api/watchlist
 */
export const getWatchlist = async (req, res) => {
  try {
    const { status, tag, genre, sort = 'addedAt' } = req.query;
    
    let query = { ...getUserFilter(req) };
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by tag
    if (tag) {
      query['tags.value'] = { $regex: tag, $options: 'i' };
    }
    
    // Filter by genre
    if (genre) {
      query.genres = { $regex: genre, $options: 'i' };
    }
    
    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'title':
        sortOption = { title: 1 };
        break;
      case 'rating':
        sortOption = { vote_average: -1 };
        break;
      case 'year':
        sortOption = { year: -1 };
        break;
      case 'addedAt':
      default:
        sortOption = { addedAt: -1 };
    }
    
    const items = await Watchlist.find(query).sort(sortOption);
    
    // Get unique tags for filtering (for this user)
    const allTags = await Watchlist.aggregate([
      { $match: getUserFilter(req) },
      { $unwind: '$tags' },
      { $group: { _id: { type: '$tags.type', value: '$tags.value' } } },
      { $sort: { '_id.type': 1, '_id.value': 1 } }
    ]);
    
    // Get unique genres (for this user)
    const genreResults = await Watchlist.aggregate([
      { $match: getUserFilter(req) },
      { $unwind: '$genres' },
      { $group: { _id: '$genres' } },
      { $sort: { _id: 1 } }
    ]);
    const allGenres = genreResults.map(g => g._id).filter(Boolean);
    
    res.json({
      items,
      count: items.length,
      filters: {
        tags: allTags.map(t => t._id),
        genres: allGenres
      }
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
};

/**
 * Add movie to watchlist
 * POST /api/watchlist
 */
export const addToWatchlist = async (req, res) => {
  try {
    const { movie, tags = [], notes, status = 'want_to_watch' } = req.body;
    
    if (!movie || !movie.id) {
      return res.status(400).json({ error: 'Movie data is required' });
    }
    
    const userId = req.user._id;
    
    // Check if already in watchlist (for this user)
    const existing = await Watchlist.findOne({ 
      userId,
      movieId: movie.id 
    });
    if (existing) {
      return res.status(409).json({ 
        error: 'Movie already in watchlist',
        item: existing
      });
    }
    
    // Auto-generate genre tags
    const genreTags = (movie.genres || []).map(g => ({
      type: 'genre',
      value: g
    }));
    
    // Auto-generate decade tag
    const year = movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : null);
    const decadeTags = year ? [{
      type: 'decade',
      value: `${Math.floor(year / 10) * 10}s`
    }] : [];
    
    // Combine all tags
    const allTags = [...genreTags, ...decadeTags, ...tags];
    
    const watchlistItem = new Watchlist({
      userId,
      movieId: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      overview: movie.overview,
      release_date: movie.release_date,
      year,
      vote_average: movie.vote_average || movie.rating,
      genres: movie.genres || [],
      tags: allTags,
      notes,
      status
    });
    
    await watchlistItem.save();
    
    res.status(201).json({
      message: 'Added to watchlist',
      item: watchlistItem
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Movie already in watchlist' });
    }
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

/**
 * Update watchlist item
 * PUT /api/watchlist/:movieId
 */
export const updateWatchlistItem = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { tags, notes, status, userRating } = req.body;
    
    const item = await Watchlist.findOne({ 
      ...getUserFilter(req),
      movieId: parseInt(movieId) 
    });
    if (!item) {
      return res.status(404).json({ error: 'Movie not found in watchlist' });
    }
    
    // Update fields if provided
    if (tags !== undefined) item.tags = tags;
    if (notes !== undefined) item.notes = notes;
    if (status !== undefined) item.status = status;
    if (userRating !== undefined) item.userRating = userRating;
    
    await item.save();
    
    res.json({
      message: 'Watchlist item updated',
      item
    });
  } catch (error) {
    console.error('Update watchlist error:', error);
    res.status(500).json({ error: 'Failed to update watchlist item' });
  }
};

/**
 * Remove movie from watchlist
 * DELETE /api/watchlist/:movieId
 */
export const removeFromWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const result = await Watchlist.findOneAndDelete({ 
      ...getUserFilter(req),
      movieId: parseInt(movieId) 
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Movie not found in watchlist' });
    }
    
    res.json({
      message: 'Removed from watchlist',
      movieId: parseInt(movieId)
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};

/**
 * Check if movie is in watchlist
 * GET /api/watchlist/check/:movieId
 */
export const checkInWatchlist = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const item = await Watchlist.findOne({ 
      ...getUserFilter(req),
      movieId: parseInt(movieId) 
    });
    
    res.json({
      inWatchlist: !!item,
      item: item || null
    });
  } catch (error) {
    console.error('Check watchlist error:', error);
    res.status(500).json({ error: 'Failed to check watchlist' });
  }
};

/**
 * Add custom tag to watchlist item
 * POST /api/watchlist/:movieId/tags
 */
export const addTag = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { type = 'custom', value } = req.body;
    
    if (!value) {
      return res.status(400).json({ error: 'Tag value is required' });
    }
    
    const item = await Watchlist.findOne({ 
      ...getUserFilter(req),
      movieId: parseInt(movieId) 
    });
    if (!item) {
      return res.status(404).json({ error: 'Movie not found in watchlist' });
    }
    
    // Check if tag already exists
    const tagExists = item.tags.some(t => t.type === type && t.value.toLowerCase() === value.toLowerCase());
    if (tagExists) {
      return res.status(409).json({ error: 'Tag already exists' });
    }
    
    item.tags.push({ type, value });
    await item.save();
    
    res.json({
      message: 'Tag added',
      item
    });
  } catch (error) {
    console.error('Add tag error:', error);
    res.status(500).json({ error: 'Failed to add tag' });
  }
};

/**
 * Remove tag from watchlist item
 * DELETE /api/watchlist/:movieId/tags
 */
export const removeTag = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { type, value } = req.body;
    
    const item = await Watchlist.findOne({ 
      ...getUserFilter(req),
      movieId: parseInt(movieId) 
    });
    if (!item) {
      return res.status(404).json({ error: 'Movie not found in watchlist' });
    }
    
    item.tags = item.tags.filter(t => !(t.type === type && t.value === value));
    await item.save();
    
    res.json({
      message: 'Tag removed',
      item
    });
  } catch (error) {
    console.error('Remove tag error:', error);
    res.status(500).json({ error: 'Failed to remove tag' });
  }
};
