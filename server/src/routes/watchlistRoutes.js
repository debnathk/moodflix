import express from 'express';
import {
  getWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
  checkInWatchlist,
  addTag,
  removeTag
} from '../controllers/watchlistController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All watchlist routes require authentication
router.use(protect);

// Get all watchlist items (user's own)
router.get('/', getWatchlist);

// Check if movie is in watchlist
router.get('/check/:movieId', checkInWatchlist);

// Add movie to watchlist
router.post('/', addToWatchlist);

// Update watchlist item
router.put('/:movieId', updateWatchlistItem);

// Remove movie from watchlist
router.delete('/:movieId', removeFromWatchlist);

// Add tag to watchlist item
router.post('/:movieId/tags', addTag);

// Remove tag from watchlist item
router.delete('/:movieId/tags', removeTag);

export default router;
