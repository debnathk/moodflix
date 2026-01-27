import tmdbService from '../services/tmdbService.js';

export const searchMoviesTool = {
  name: 'searchMovies',
  description: 'Search for movies based on genre, year range, rating, or keywords. Use this to find movies that match specific criteria.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for movie title or keywords (optional)'
      },
      genres: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of genres to filter by (e.g., ["Action", "Comedy"])'
      },
      yearFrom: {
        type: 'number',
        description: 'Start year for release date filter'
      },
      yearTo: {
        type: 'number',
        description: 'End year for release date filter'
      },
      minRating: {
        type: 'number',
        description: 'Minimum rating (0-10)'
      },
      mood: {
        type: 'string',
        description: 'Mood keyword to match (happy, sad, excited, relaxed, thoughtful, romantic, scared, nostalgic, adventurous, curious, cozy, melancholy, energetic, mysterious)'
      }
    }
  },
  
  async execute(args) {
    try {
      let result;
      
      // If mood is specified, use mood-based search
      if (args.mood) {
        result = await tmdbService.getMoviesByMood(args.mood, {
          yearFrom: args.yearFrom,
          yearTo: args.yearTo,
          minRating: args.minRating
        });
      } else {
        result = await tmdbService.searchMovies({
          query: args.query,
          genres: args.genres,
          yearFrom: args.yearFrom,
          yearTo: args.yearTo,
          minRating: args.minRating
        });
      }

      // Limit to top 10 results for agent context
      const movies = result.movies.slice(0, 10);
      
      return {
        success: true,
        count: movies.length,
        totalResults: result.totalResults,
        movies: movies.map(m => ({
          id: m.id,
          title: m.title,
          year: m.year,
          rating: m.vote_average,
          genres: m.genres,
          overview: m.overview?.substring(0, 200) + (m.overview?.length > 200 ? '...' : ''),
          poster_path: m.poster_path
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default searchMoviesTool;
