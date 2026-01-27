import express from 'express';
import tmdbService from '../services/tmdbService.js';

const router = express.Router();

/**
 * Get movie details with similar movies
 * GET /api/movies/:movieId
 */
router.get('/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // Get movie details
    const movie = await tmdbService.getMovieDetails(parseInt(movieId));
    
    // Get similar movies
    const similarResult = await tmdbService.getSimilarMovies(parseInt(movieId));
    
    res.json({
      success: true,
      movie,
      similarMovies: similarResult.movies.slice(0, 10)
    });
  } catch (error) {
    console.error('Get movie details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get movie details'
    });
  }
});

/**
 * Get similar movies for a movie
 * GET /api/movies/:movieId/similar
 */
router.get('/:movieId/similar', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { page = 1 } = req.query;
    
    const result = await tmdbService.getSimilarMovies(parseInt(movieId), parseInt(page));
    
    res.json({
      success: true,
      movies: result.movies,
      totalPages: result.totalPages,
      totalResults: result.totalResults
    });
  } catch (error) {
    console.error('Get similar movies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get similar movies'
    });
  }
});

/**
 * Get trending movies
 * GET /api/movies/trending/:timeWindow
 */
router.get('/trending/:timeWindow', async (req, res) => {
  try {
    const { timeWindow } = req.params;
    const result = await tmdbService.getTrending(timeWindow);
    
    res.json({
      success: true,
      movies: result.movies
    });
  } catch (error) {
    console.error('Get trending movies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending movies'
    });
  }
});

export default router;
