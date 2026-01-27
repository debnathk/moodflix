import llmService from './llmService.js';
import { executeTool } from '../tools/index.js';
import Conversation from '../models/Conversation.js';

// Mood detection patterns
const MOOD_PATTERNS = {
  happy: /\b(happy|joyful|cheerful|upbeat|fun|laugh|funny|comedy|hilarious)\b/i,
  sad: /\b(sad|down|depressed|melancholy|cry|emotional|heartbreak)\b/i,
  excited: /\b(excited|thrilling|action|adventure|adrenaline|intense|epic)\b/i,
  relaxed: /\b(relax|chill|calm|peaceful|easy|light)\b/i,
  cozy: /\b(cozy|cosy|comfort|warm|feel.?good|heartwarming|wholesome)\b/i,
  nostalgic: /\b(nostalgic|nostalgia|classic|old|remember|childhood|retro)\b/i,
  romantic: /\b(romantic|romance|love|date|couple|relationship)\b/i,
  scared: /\b(scared|horror|scary|thriller|suspense|creepy|terrifying)\b/i,
  thoughtful: /\b(thoughtful|think|intellectual|documentary|deep|philosophical|mind)\b/i,
  curious: /\b(curious|mystery|detective|crime|whodunit|investigate)\b/i
};

// Decade detection
const DECADE_PATTERNS = {
  '80s': { yearFrom: 1980, yearTo: 1989 },
  '1980s': { yearFrom: 1980, yearTo: 1989 },
  '90s': { yearFrom: 1990, yearTo: 1999 },
  '1990s': { yearFrom: 1990, yearTo: 1999 },
  '2000s': { yearFrom: 2000, yearTo: 2009 },
  '2010s': { yearFrom: 2010, yearTo: 2019 },
  '2020s': { yearFrom: 2020, yearTo: 2029 }
};

// Artist/Actor request patterns - ORDER MATTERS: more specific patterns first
const ARTIST_PATTERNS = [
  // "[genre] starring/with/featuring [Name]" - handles compound queries like "romance starring brad pitt"
  // This pattern is the most specific for compound queries - captures everything after starring/with/featuring
  /(?:starring|featuring|with)\s+([a-z]+(?:\s+[a-z]+)+)\s*$/i,
  // "movies with/starring/featuring/by [Name]"
  /movies?\s+(?:with|starring|featuring|by)\s+(.+?)(?:\s*$|\s*,|\s+and\s|\s+in\s|\s+from\s)/i,
  // "films with/starring/featuring/by [Name]"
  /films?\s+(?:with|starring|featuring|by)\s+(.+?)(?:\s*$|\s*,)/i,
  // "show/find/get me [Name] movies" - captures name between "me" and "movies"
  /(?:show|find|get|recommend)\s+me\s+(.+?)\s+(?:movies?|films?)/i,
  // "show me some [Name] movies"
  /(?:show|find|get|recommend)\s+me\s+some\s+(.+?)\s+(?:movies?|films?)/i,
  // "what movies has [Name] been in"
  /(?:what|which)\s+movies?\s+(?:has|did|does|is)\s+(.+?)\s+(?:in|star|act|been)/i,
  // "[Name] movies" - only when name looks like a proper name (2+ capitalized words)
  /^(?:now\s+)?(?:show\s+me\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:movies?|films?)$/i,
  // "please [Name]" or just "[Name]" - proper name without movies/films keyword (capitalized)
  /^(?:please\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/i,
  // Catch all: extract proper names (First Last format) - requires capital letters
  /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/
];

// Common words to filter out from artist detection
const COMMON_WORDS = new Set([
  'a', 'an', 'the', 'some', 'any', 'good', 'great', 'best', 'top', 'new', 'old',
  'funny', 'scary', 'romantic', 'action', 'comedy', 'drama', 'thriller', 'horror',
  'classic', 'modern', 'recent', 'popular', 'famous', 'cozy', 'feel', 'more',
  'something', 'anything', 'nothing', 'everything', 'movie', 'movies', 'film', 'films',
  'show', 'me', 'now', 'please', 'can', 'you', 'i', 'want', 'like', 'love', 'need',
  'find', 'get', 'recommend', 'suggest', 'give',
  // Genre words that should not be part of artist names
  'romance', 'adventure', 'mystery', 'fantasy', 'sci-fi', 'scifi', 'animation',
  'documentary', 'crime', 'war', 'western', 'musical', 'family', 'history',
  // Keywords that indicate the next word is the artist
  'starring', 'featuring', 'with', 'by', 'from'
]);

class MovieAgent {
  constructor() {
    this.maxIterations = 3;
  }

  /**
   * Detect mood from user message
   */
  detectMood(message) {
    for (const [mood, pattern] of Object.entries(MOOD_PATTERNS)) {
      if (pattern.test(message)) {
        return mood;
      }
    }
    return 'cozy'; // Default mood
  }

  /**
   * Detect decade from user message
   */
  detectDecade(message) {
    for (const [decade, years] of Object.entries(DECADE_PATTERNS)) {
      if (message.toLowerCase().includes(decade)) {
        return years;
      }
    }
    return null;
  }

  /**
   * Detect artist/actor name from user message
   */
  detectArtist(message) {
    // First, check for explicit patterns
    for (const pattern of ARTIST_PATTERNS) {
      const match = message.match(pattern);
      if (match && match[1]) {
        let name = match[1].trim();
        
        // Clean up the name - remove common prefixes/suffixes
        name = name.replace(/^(now|please|some|more)\s+/i, '');
        name = name.replace(/\s+(please|now)$/i, '');
        name = name.trim();
        
        // Filter out common words and short names
        const words = name.toLowerCase().split(/\s+/);
        const meaningfulWords = words.filter(w => !COMMON_WORDS.has(w));
        
        // Need at least 2 meaningful words (first + last name)
        if (meaningfulWords.length < 2 || name.length < 3) {
          continue;
        }
        
        // Convert to proper case (Title Case) for consistency
        const properName = meaningfulWords
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        
        // Accept if has 2+ meaningful words and not too many words (typical name format)
        if (meaningfulWords.length >= 2 && words.length <= 4) {
          console.log(`Detected artist: "${properName}" from pattern: ${pattern}`);
          return properName;
        }
      }
    }
    return null;
  }

  /**
   * Get genres associated with a mood (matching TMDB genre names)
   */
  getGenresForMood(mood) {
    const moodToGenres = {
      happy: ['Comedy', 'Animation', 'Family'],
      sad: ['Drama', 'Romance'],
      excited: ['Action', 'Adventure', 'Thriller'],
      relaxed: ['Comedy', 'Family', 'Animation'],
      cozy: ['Comedy', 'Family', 'Animation', 'Romance'],
      nostalgic: ['Drama', 'Comedy', 'Family'],
      romantic: ['Romance', 'Comedy', 'Drama'],
      scared: ['Horror', 'Thriller', 'Mystery'],
      thoughtful: ['Documentary', 'Drama', 'Science Fiction'],
      curious: ['Documentary', 'Mystery', 'Science Fiction', 'Crime'],
      melancholy: ['Drama', 'Romance'],
      energetic: ['Action', 'Adventure', 'Music'],
      mysterious: ['Mystery', 'Thriller', 'Crime']
    };
    return moodToGenres[mood] || [];
  }

  /**
   * Process a chat message
   */
  async chat(userMessage, conversationId = null) {
    // Load or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    
    if (!conversation) {
      conversation = new Conversation({ messages: [] });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: userMessage
    });

    let finalResponse = '';
    let recommendedMovies = [];
    let artistInfo = null;

    try {
      // Detect BOTH artist and mood/genre from the message
      const artistName = this.detectArtist(userMessage);
      const mood = this.detectMood(userMessage);
      const decade = this.detectDecade(userMessage);
      
      // Check if mood is explicitly mentioned (not just the default fallback)
      const hasExplicitMood = mood !== 'cozy' || /\b(cozy|cosy|comfort|warm|feel.?good|heartwarming|wholesome)\b/i.test(userMessage);
      
      console.log(`Detected - Artist: ${artistName}, Mood: ${mood}, HasExplicitMood: ${hasExplicitMood}, Decade:`, decade);
      
      if (artistName) {
        // Search for movies by this artist
        const toolResult = await executeTool('getMoviesByArtist', { artistName });
        
        if (toolResult.success && toolResult.movies && toolResult.movies.length > 0) {
          let movies = toolResult.movies;
          artistInfo = toolResult.artist;
          
          // If mood/genre is also explicitly mentioned, filter by genre
          let genreFilter = null;
          if (hasExplicitMood) {
            const genresForMood = this.getGenresForMood(mood);
            if (genresForMood.length > 0) {
              genreFilter = mood;
              const filteredMovies = movies.filter(m => 
                m.genres?.some(g => genresForMood.includes(g))
              );
              // Only use filtered results if we have enough movies
              if (filteredMovies.length >= 2) {
                movies = filteredMovies;
                console.log(`Filtered ${artistName}'s movies by ${mood} genre: ${filteredMovies.length} results`);
              } else {
                console.log(`Not enough ${mood} movies for ${artistName}, showing all movies`);
                genreFilter = null;
              }
            }
          }
          
          // Also filter by decade if specified
          if (decade) {
            const decadeFiltered = movies.filter(m => 
              m.year >= decade.yearFrom && m.year <= decade.yearTo
            );
            if (decadeFiltered.length >= 2) {
              movies = decadeFiltered;
              console.log(`Filtered by decade ${decade.yearFrom}-${decade.yearTo}: ${decadeFiltered.length} results`);
            }
          }
          
          recommendedMovies = movies.slice(0, 5);
          
          // Format movies for the LLM prompt
          const movieList = recommendedMovies.map((m, i) => 
            `${i + 1}. "${m.title}" (${m.year}) - Rating: ${m.rating}/10 - ${m.genres.join(', ')}`
          ).join('\n');

          // Build context for LLM based on what was detected
          let searchContext = `Artist: ${artistInfo.name}`;
          if (genreFilter) {
            searchContext += `\nGenre filter: ${genreFilter} movies`;
          }
          if (decade) {
            searchContext += `\nDecade: ${decade.yearFrom}s`;
          }

          // Ask LLM to create a nice response about this artist's movies
          const response = await llmService.chat([
            { 
              role: 'system', 
              content: `You are MoodFlix, a friendly movie recommender. Create a brief, warm response about the actor/actress and their movies${genreFilter ? ` in the ${genreFilter} genre` : ''}. Mention 2-3 movies with a short note about each. Keep it under 150 words.` 
            },
            { 
              role: 'user', 
              content: `User asked about: "${userMessage}"\n\n${searchContext}\nTheir movies:\n${movieList}` 
            }
          ]);

          finalResponse = response.content;
        } else {
          // Artist not found, fall back to mood-based search
          console.log(`Artist "${artistName}" not found, falling back to mood search`);
          const result = await this.handleMoodSearch(userMessage);
          if (result.movies) {
            recommendedMovies = result.movies;
            finalResponse = result.message;
          }
        }
      } else {
        // No artist detected, do mood-based search
        const result = await this.handleMoodSearch(userMessage);
        recommendedMovies = result.movies || [];
        finalResponse = result.message;
      }
    } catch (error) {
      console.error('Agent error:', error);
      finalResponse = "I'm having trouble finding movies right now. Please try again!";
    }

    // Add assistant response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: finalResponse,
      movies: recommendedMovies.map(m => ({
        id: m.id,
        title: m.title,
        poster_path: m.poster_path,
        overview: m.overview,
        release_date: m.release_date,
        vote_average: m.rating,
        genre_ids: []
      }))
    });

    // Save conversation
    await conversation.save();

    return {
      conversationId: conversation._id,
      message: finalResponse,
      movies: recommendedMovies,
      artist: artistInfo
    };
  }

  /**
   * Handle mood-based movie search
   */
  async handleMoodSearch(userMessage) {
    const mood = this.detectMood(userMessage);
    const decade = this.detectDecade(userMessage);
    
    console.log(`Detected mood: ${mood}, decade:`, decade);

    // Search for movies
    const searchArgs = { mood };
    if (decade) {
      searchArgs.yearFrom = decade.yearFrom;
      searchArgs.yearTo = decade.yearTo;
    }

    const toolResult = await executeTool('searchMovies', searchArgs);
    
    if (toolResult.success && toolResult.movies && toolResult.movies.length > 0) {
      const movies = toolResult.movies.slice(0, 5);
      
      // Format movies for the LLM prompt
      const movieList = movies.map((m, i) => 
        `${i + 1}. "${m.title}" (${m.year}) - Rating: ${m.rating}/10 - ${m.genres.join(', ')}`
      ).join('\n');

      // Ask LLM to create a nice response
      const response = await llmService.chat([
        { 
          role: 'system', 
          content: 'You are MoodFlix, a friendly movie recommender. Create a brief, warm response recommending the movies below. For each movie, write 1 sentence about why it fits the mood. Keep it conversational and under 200 words total.' 
        },
        { 
          role: 'user', 
          content: `User said: "${userMessage}"\n\nRecommend these movies:\n${movieList}` 
        }
      ]);

      return { message: response.content, movies };
    } else {
      return { 
        message: "I couldn't find movies matching your request. Try mentioning a mood (funny, scary, romantic), a decade (80s, 90s), or an actor's name!", 
        movies: [] 
      };
    }
  }

  /**
   * Build message history for the LLM
   */
  buildMessageHistory(messages) {
    const history = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Include last 10 messages for context
    const recentMessages = messages.slice(-10);
    
    for (const msg of recentMessages) {
      history.push({
        role: msg.role,
        content: msg.content
      });
    }

    return history;
  }

  /**
   * Clean the response from any remaining tool call artifacts
   */
  cleanResponse(response) {
    // Remove TOOL_CALL lines
    response = response.replace(/TOOL_CALL:\s*\{[\s\S]*?\}\n*/g, '');
    // Remove tool call tags
    response = response.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '');
    // Remove any tool result references
    response = response.replace(/Tool result for \w+:[\s\S]*?(?=\n\n|$)/g, '');
    // Remove JSON blocks that look like tool calls
    response = response.replace(/```json\s*\{[\s\S]*?"name"[\s\S]*?\}\s*```/g, '');
    // Clean up extra whitespace
    response = response.replace(/\n{3,}/g, '\n\n');
    response = response.trim();
    return response;
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return null;
    }

    return {
      id: conversation._id,
      messages: conversation.messages.map(m => ({
        role: m.role,
        content: m.content,
        movies: m.movies || [],
        timestamp: m.timestamp
      })),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };
  }

  /**
   * Create a new conversation
   */
  async createConversation() {
    const conversation = new Conversation({ messages: [] });
    await conversation.save();
    
    return {
      id: conversation._id,
      messages: [],
      createdAt: conversation.createdAt
    };
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId) {
    await Conversation.findByIdAndDelete(conversationId);
  }
}

export default new MovieAgent();
