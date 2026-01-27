import mongoose from 'mongoose';

const watchlistItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  movieId: {
    type: Number,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  poster_path: String,
  backdrop_path: String,
  overview: String,
  release_date: String,
  year: Number,
  vote_average: Number,
  // Tags for filtering
  tags: [{
    type: {
      type: String,
      enum: ['genre', 'artist', 'mood', 'decade', 'custom'],
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],
  genres: [String],
  // User notes
  notes: String,
  // Watch status
  status: {
    type: String,
    enum: ['want_to_watch', 'watching', 'watched'],
    default: 'want_to_watch'
  },
  // Rating given by user (optional)
  userRating: {
    type: Number,
    min: 1,
    max: 10
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate movies in watchlist per user
// Using sparse index to allow multiple null userId (guest users)
watchlistItemSchema.index({ userId: 1, movieId: 1 }, { unique: true });

watchlistItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Watchlist = mongoose.model('Watchlist', watchlistItemSchema);

export default Watchlist;
