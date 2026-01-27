import tmdbService from '../services/tmdbService.js';

export const getSimilarMoviesTool = {
  name: 'getSimilarMovies',
  description: 'Find movies similar to a given movie. Use this when the user mentions they liked a specific movie and want more like it.',
  parameters: {
    type: 'object',
    properties: {
      movieId: {
        type: 'number',
        description: 'The TMDB movie ID to find similar movies for'
      }
    },
    required: ['movieId']
  },
  
  async execute(args) {
    try {
      const result = await tmdbService.getSimilarMovies(args.movieId);
      
      // Limit to top 8 similar movies
      const movies = result.movies.slice(0, 8);
      
      return {
        success: true,
        count: movies.length,
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

export default getSimilarMoviesTool;
