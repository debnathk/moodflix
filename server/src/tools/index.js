import searchMoviesTool from './searchMovies.js';
import getMovieDetailsTool from './getMovieDetails.js';
import getSimilarMoviesTool from './getSimilarMovies.js';
import getMoviesByArtistTool from './getMoviesByArtist.js';

export const tools = [
  searchMoviesTool,
  getMovieDetailsTool,
  getSimilarMoviesTool,
  getMoviesByArtistTool
];

export const toolMap = {
  searchMovies: searchMoviesTool,
  getMovieDetails: getMovieDetailsTool,
  getSimilarMovies: getSimilarMoviesTool,
  getMoviesByArtist: getMoviesByArtistTool
};

/**
 * Execute a tool by name with given arguments
 */
export async function executeTool(name, args) {
  const tool = toolMap[name];
  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${name}`
    };
  }
  
  return await tool.execute(args);
}

export default tools;
