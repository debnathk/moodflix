import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable cookies for authentication
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect automatically - let the UI handle it
    }
    return Promise.reject(error);
  }
);

/**
 * Send a chat message
 */
export const sendMessage = async (message, conversationId = null) => {
  const response = await api.post('/chat', {
    message,
    conversationId
  });
  return response.data;
};

/**
 * Get conversation history
 */
export const getConversation = async (conversationId) => {
  const response = await api.get(`/chat/${conversationId}`);
  return response.data;
};

/**
 * Create a new conversation
 */
export const createConversation = async () => {
  const response = await api.post('/chat/new');
  return response.data;
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/chat/${conversationId}`);
  return response.data;
};

/**
 * Get LLM (OpenAI) status
 */
export const getStatus = async () => {
  const response = await api.get('/chat/status');
  return response.data;
};

// ==================== Movie API ====================

/**
 * Get movie details with similar movies
 */
export const getMovieDetails = async (movieId) => {
  const response = await api.get(`/movies/${movieId}`);
  return response.data;
};

/**
 * Get similar movies
 */
export const getSimilarMovies = async (movieId, page = 1) => {
  const response = await api.get(`/movies/${movieId}/similar`, { params: { page } });
  return response.data;
};

// ==================== Watchlist API ====================

/**
 * Get watchlist items
 */
export const getWatchlist = async (params = {}) => {
  const response = await api.get('/watchlist', { params });
  return response.data;
};

/**
 * Add movie to watchlist
 */
export const addToWatchlist = async (movie, tags = [], notes = '') => {
  const response = await api.post('/watchlist', {
    movie,
    tags,
    notes
  });
  return response.data;
};

/**
 * Remove movie from watchlist
 */
export const removeFromWatchlist = async (movieId) => {
  const response = await api.delete(`/watchlist/${movieId}`);
  return response.data;
};

/**
 * Update watchlist item
 */
export const updateWatchlistItem = async (movieId, data) => {
  const response = await api.put(`/watchlist/${movieId}`, data);
  return response.data;
};

/**
 * Check if movie is in watchlist
 */
export const checkInWatchlist = async (movieId) => {
  const response = await api.get(`/watchlist/check/${movieId}`);
  return response.data;
};

/**
 * Add tag to watchlist item
 */
export const addTagToWatchlistItem = async (movieId, type, value) => {
  const response = await api.post(`/watchlist/${movieId}/tags`, { type, value });
  return response.data;
};

/**
 * Remove tag from watchlist item
 */
export const removeTagFromWatchlistItem = async (movieId, type, value) => {
  const response = await api.delete(`/watchlist/${movieId}/tags`, { data: { type, value } });
  return response.data;
};

// ==================== Auth API ====================

/**
 * Register a new user
 */
export const register = async (username, email, password) => {
  const response = await api.post('/auth/register', {
    username,
    email,
    password
  });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

/**
 * Login user
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password
  });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Get current user
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Update user profile
 */
export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data);
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

/**
 * Check if user is logged in (from local storage)
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Get stored user from local storage
 */
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default api;
