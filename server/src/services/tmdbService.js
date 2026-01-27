import axios from 'axios';
import MovieCache from '../models/MovieCache.js';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Genre mapping for mood-based searches
export const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Reverse mapping for genre name to ID
export const GENRE_NAME_TO_ID = Object.entries(GENRE_MAP).reduce((acc, [id, name]) => {
  acc[name.toLowerCase()] = parseInt(id);
  return acc;
}, {});

class TMDBService {
  constructor() {
    this._client = null;
  }

  get client() {
    if (!this._client) {
      this._client = axios.create({
        baseURL: TMDB_BASE_URL,
        params: {
          api_key: process.env.TMDB_API_KEY
        }
      });
    }
    return this._client;
  }

  get apiKey() {
    return process.env.TMDB_API_KEY;
  }

  /**
   * Search for movies with various filters
   */
  async searchMovies({ query, genres, yearFrom, yearTo, minRating, sortBy = 'popularity.desc', page = 1 }) {
    try {
      let endpoint = '/discover/movie';
      const params = {
        page,
        sort_by: sortBy,
        'vote_count.gte': 50, // Ensure movies have some reviews
        include_adult: false
      };

      // If there's a search query, use search endpoint instead
      if (query) {
        endpoint = '/search/movie';
        params.query = query;
      }

      // Add genre filter
      if (genres && genres.length > 0) {
        const genreIds = genres.map(g => {
          if (typeof g === 'number') return g;
          return GENRE_NAME_TO_ID[g.toLowerCase()] || null;
        }).filter(Boolean);
        if (genreIds.length > 0) {
          params.with_genres = genreIds.join(',');
        }
      }

      // Add year filters
      if (yearFrom) {
        params['primary_release_date.gte'] = `${yearFrom}-01-01`;
      }
      if (yearTo) {
        params['primary_release_date.lte'] = `${yearTo}-12-31`;
      }

      // Add rating filter
      if (minRating) {
        params['vote_average.gte'] = minRating;
      }

      const response = await this.client.get(endpoint, { params });
      
      return {
        movies: response.data.results.map(movie => this.formatMovie(movie)),
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
        page: response.data.page
      };
    } catch (error) {
      console.error('TMDB Search Error:', error.message);
      throw new Error('Failed to search movies');
    }
  }

  /**
   * Get detailed movie information
   */
  async getMovieDetails(movieId) {
    try {
      // Check cache first
      const cached = await MovieCache.findOne({ tmdbId: movieId });
      if (cached && cached.credits) {
        return this.formatMovieDetails(cached.toObject());
      }

      // Fetch from TMDB with credits
      const response = await this.client.get(`/movie/${movieId}`, {
        params: {
          append_to_response: 'credits,similar,keywords'
        }
      });

      const movieData = response.data;

      // Cache the result
      await MovieCache.findOneAndUpdate(
        { tmdbId: movieId },
        {
          tmdbId: movieId,
          title: movieData.title,
          original_title: movieData.original_title,
          overview: movieData.overview,
          poster_path: movieData.poster_path,
          backdrop_path: movieData.backdrop_path,
          release_date: movieData.release_date,
          vote_average: movieData.vote_average,
          vote_count: movieData.vote_count,
          popularity: movieData.popularity,
          genres: movieData.genres,
          runtime: movieData.runtime,
          tagline: movieData.tagline,
          credits: {
            cast: movieData.credits?.cast?.slice(0, 10) || [],
            crew: movieData.credits?.crew?.filter(c => 
              ['Director', 'Writer', 'Screenplay'].includes(c.job)
            ) || []
          },
          cachedAt: new Date()
        },
        { upsert: true, new: true }
      );

      return this.formatMovieDetails(movieData);
    } catch (error) {
      console.error('TMDB Details Error:', error.message);
      throw new Error('Failed to get movie details');
    }
  }

  /**
   * Get similar movies
   */
  async getSimilarMovies(movieId, page = 1) {
    try {
      const response = await this.client.get(`/movie/${movieId}/similar`, {
        params: { page }
      });

      return {
        movies: response.data.results.map(movie => this.formatMovie(movie)),
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    } catch (error) {
      console.error('TMDB Similar Error:', error.message);
      throw new Error('Failed to get similar movies');
    }
  }

  /**
   * Get movies by mood keywords
   */
  async getMoviesByMood(mood, options = {}) {
    const moodMappings = {
      happy: { genres: ['Comedy', 'Animation', 'Family'], minRating: 6.5 },
      sad: { genres: ['Drama', 'Romance'], minRating: 7 },
      excited: { genres: ['Action', 'Adventure', 'Thriller'], minRating: 6.5 },
      relaxed: { genres: ['Comedy', 'Family', 'Animation'], minRating: 6 },
      thoughtful: { genres: ['Documentary', 'Drama', 'Science Fiction'], minRating: 7 },
      romantic: { genres: ['Romance', 'Comedy'], minRating: 6 },
      scared: { genres: ['Horror', 'Thriller'], minRating: 6 },
      nostalgic: { genres: ['Drama', 'Comedy', 'Family'], yearTo: 2010, minRating: 6.5 },
      adventurous: { genres: ['Adventure', 'Action', 'Fantasy'], minRating: 6.5 },
      curious: { genres: ['Documentary', 'Mystery', 'Science Fiction'], minRating: 6.5 },
      cozy: { genres: ['Comedy', 'Family', 'Animation', 'Romance'], minRating: 6.5 },
      melancholy: { genres: ['Drama', 'Romance'], minRating: 7 },
      energetic: { genres: ['Action', 'Adventure', 'Music'], minRating: 6 },
      mysterious: { genres: ['Mystery', 'Thriller', 'Crime'], minRating: 6.5 }
    };

    const moodConfig = moodMappings[mood.toLowerCase()] || { genres: ['Drama', 'Comedy'], minRating: 6.5 };
    
    // Add randomization by selecting a random page (1-5) to get varied results
    const randomPage = Math.floor(Math.random() * 5) + 1;
    
    const result = await this.searchMovies({
      ...moodConfig,
      ...options,
      sortBy: 'popularity.desc',
      page: randomPage
    });
    
    // Shuffle results for more variety
    if (result.movies && result.movies.length > 0) {
      result.movies = this.shuffleArray([...result.movies]);
    }
    
    return result;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Search for a person (actor/director)
   */
  async searchPerson(name) {
    try {
      const response = await this.client.get('/search/person', {
        params: { query: name }
      });

      if (response.data.results.length === 0) {
        return null;
      }

      const person = response.data.results[0];
      return {
        id: person.id,
        name: person.name,
        profile_path: person.profile_path ? `${TMDB_IMAGE_BASE}/w185${person.profile_path}` : null,
        known_for_department: person.known_for_department,
        popularity: person.popularity
      };
    } catch (error) {
      console.error('TMDB Person Search Error:', error.message);
      return null;
    }
  }

  /**
   * Get movies by actor/person
   */
  async getMoviesByPerson(personId, options = {}) {
    try {
      // Add randomization by selecting a random page (1-3) for variety
      const randomPage = options.page || (Math.floor(Math.random() * 3) + 1);
      
      const response = await this.client.get('/discover/movie', {
        params: {
          with_cast: personId,
          sort_by: options.sortBy || 'popularity.desc',
          'vote_count.gte': 50,
          page: randomPage
        }
      });

      // Shuffle results for more variety
      const movies = this.shuffleArray([...response.data.results.map(movie => this.formatMovie(movie))]);
      
      return {
        movies,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      };
    } catch (error) {
      console.error('TMDB Movies by Person Error:', error.message);
      throw new Error('Failed to get movies by person');
    }
  }

  /**
   * Get person details with filmography
   */
  async getPersonDetails(personId) {
    try {
      const response = await this.client.get(`/person/${personId}`, {
        params: {
          append_to_response: 'movie_credits'
        }
      });

      const person = response.data;
      const movies = person.movie_credits?.cast || [];
      
      // Filter out low-rated movies and get decent quality ones
      const qualityMovies = movies
        .filter(m => m.vote_count > 50 && m.vote_average >= 5.5)
        .sort((a, b) => b.popularity - a.popularity);
      
      // Take top 20 popular movies, then shuffle and pick 10 for variety
      const topPool = qualityMovies.slice(0, 20);
      const shuffled = this.shuffleArray([...topPool]);
      const topMovies = shuffled.slice(0, 10).map(movie => this.formatMovie(movie));

      return {
        id: person.id,
        name: person.name,
        biography: person.biography,
        birthday: person.birthday,
        profile_path: person.profile_path ? `${TMDB_IMAGE_BASE}/w185${person.profile_path}` : null,
        known_for_department: person.known_for_department,
        movies: topMovies
      };
    } catch (error) {
      console.error('TMDB Person Details Error:', error.message);
      throw new Error('Failed to get person details');
    }
  }

  /**
   * Get trending movies
   */
  async getTrending(timeWindow = 'week') {
    try {
      const response = await this.client.get(`/trending/movie/${timeWindow}`);
      return {
        movies: response.data.results.map(movie => this.formatMovie(movie))
      };
    } catch (error) {
      console.error('TMDB Trending Error:', error.message);
      throw new Error('Failed to get trending movies');
    }
  }

  /**
   * Format movie data for response
   */
  formatMovie(movie) {
    return {
      id: movie.id || movie.tmdbId,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}` : null,
      backdrop_path: movie.backdrop_path ? `${TMDB_IMAGE_BASE}/original${movie.backdrop_path}` : null,
      release_date: movie.release_date,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      vote_average: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
      genre_ids: movie.genre_ids || (movie.genres ? movie.genres.map(g => g.id) : []),
      genres: movie.genre_ids ? movie.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean) : 
              (movie.genres ? movie.genres.map(g => g.name) : [])
    };
  }

  /**
   * Format detailed movie data
   */
  formatMovieDetails(movie) {
    const formatted = this.formatMovie(movie);
    return {
      ...formatted,
      runtime: movie.runtime,
      tagline: movie.tagline,
      genres: movie.genres ? movie.genres.map(g => g.name) : formatted.genres,
      cast: movie.credits?.cast?.slice(0, 5).map(c => ({
        name: c.name,
        character: c.character,
        profile_path: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : null
      })) || [],
      director: movie.credits?.crew?.find(c => c.job === 'Director')?.name || null
    };
  }
}

export default new TMDBService();
