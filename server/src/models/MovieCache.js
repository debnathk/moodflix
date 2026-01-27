import mongoose from 'mongoose';

const movieCacheSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  title: String,
  original_title: String,
  overview: String,
  poster_path: String,
  backdrop_path: String,
  release_date: String,
  vote_average: Number,
  vote_count: Number,
  popularity: Number,
  genre_ids: [Number],
  genres: [{
    id: Number,
    name: String
  }],
  runtime: Number,
  tagline: String,
  credits: {
    cast: [{
      id: Number,
      name: String,
      character: String,
      profile_path: String
    }],
    crew: [{
      id: Number,
      name: String,
      job: String,
      department: String
    }]
  },
  cachedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Cache expires after 24 hours
movieCacheSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 86400 });

const MovieCache = mongoose.model('MovieCache', movieCacheSchema);

export default MovieCache;
