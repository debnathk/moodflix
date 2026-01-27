import tmdbService from '../services/tmdbService.js';

export const getMovieDetailsTool = {
  name: 'getMovieDetails',
  description: 'Get detailed information about a specific movie including cast, director, runtime, and tagline. Use this when you need more information about a movie you already know the ID of.',
  parameters: {
    type: 'object',
    properties: {
      movieId: {
        type: 'number',
        description: 'The TMDB movie ID'
      }
    },
    required: ['movieId']
  },
  
  async execute(args) {
    try {
      const movie = await tmdbService.getMovieDetails(args.movieId);
      
      return {
        success: true,
        movie: {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          rating: movie.vote_average,
          runtime: movie.runtime ? `${movie.runtime} minutes` : null,
          tagline: movie.tagline,
          genres: movie.genres,
          overview: movie.overview,
          director: movie.director,
          cast: movie.cast?.map(c => `${c.name} as ${c.character}`).join(', '),
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default getMovieDetailsTool;
