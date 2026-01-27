import tmdbService from '../services/tmdbService.js';

export const getMoviesByArtistTool = {
  name: 'getMoviesByArtist',
  description: 'Search for movies starring a specific actor or actress. Use this when the user mentions an artist/actor name and wants to see their movies.',
  parameters: {
    type: 'object',
    properties: {
      artistName: {
        type: 'string',
        description: 'The name of the actor/actress to search for'
      }
    },
    required: ['artistName']
  },
  
  async execute(args) {
    try {
      // First, search for the person
      const person = await tmdbService.searchPerson(args.artistName);
      
      if (!person) {
        return {
          success: false,
          error: `Could not find artist: ${args.artistName}`
        };
      }

      // Get their movies
      const personDetails = await tmdbService.getPersonDetails(person.id);
      
      return {
        success: true,
        artist: {
          id: person.id,
          name: person.name,
          profile_path: person.profile_path,
          known_for: person.known_for_department
        },
        count: personDetails.movies.length,
        movies: personDetails.movies.map(m => ({
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

export default getMoviesByArtistTool;
