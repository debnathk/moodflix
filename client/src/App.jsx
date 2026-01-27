import React, { useEffect, useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Watchlist from './components/Watchlist';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import MovieDetailModal from './components/MovieDetailModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import useChat from './hooks/useChat';
import { getStatus, getWatchlist } from './services/api';

function AppContent() {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    checkStatus();
  }, []);

  // Fetch watchlist count when auth state changes
  useEffect(() => {
    fetchWatchlistCount();
  }, [isAuthenticated]);

  const checkStatus = async () => {
    try {
      setStatusLoading(true);
      const statusData = await getStatus();
      setStatus(statusData);
    } catch (err) {
      console.error('Status check failed:', err);
      setStatus({ ollamaAvailable: false, error: 'Could not connect to server' });
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchWatchlistCount = async () => {
    // Only fetch watchlist count if user is authenticated
    if (!isAuthenticated) {
      setWatchlistCount(0);
      return;
    }
    try {
      const data = await getWatchlist();
      setWatchlistCount(data.count);
    } catch (err) {
      console.error('Watchlist count error:', err);
      setWatchlistCount(0);
    }
  };

  const handleOpenAuth = () => {
    setShowAuthModal(true);
  };

  const handleNewChat = () => {
    clearChat();
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseMovieModal = () => {
    setSelectedMovie(null);
  };

  return (
    <div className="min-h-screen bg-dark-500 flex flex-col">
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* User Menu / Sign In Button */}
        <div className="flex justify-end">
          <UserMenu onOpenAuth={() => setShowAuthModal(true)} />
        </div>

        {/* Watchlist Button */}
        <button
          onClick={() => {
            if (isAuthenticated) {
              setShowWatchlist(true);
            } else {
              setShowAuthModal(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all hover:scale-105"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Watchlist</span>
          {isAuthenticated && watchlistCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {watchlistCount}
            </span>
          )}
        </button>
      </div>

      {/* Watchlist Modal */}
      {showWatchlist && (
        <Watchlist 
          onClose={() => {
            setShowWatchlist(false);
            fetchWatchlistCount();
          }} 
        />
      )}

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={handleCloseMovieModal}
          onRequireAuth={handleOpenAuth}
          onSelectMovie={handleMovieClick}
        />
      )}

      {/* Status Banner */}
      {!statusLoading && status && !status.llmAvailable && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-amber-400 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              OpenAI API is not configured. Please add your OPENAI_API_KEY to the server .env file.
            </span>
            <button 
              onClick={checkStatus}
              className="ml-auto text-amber-300 hover:text-amber-200 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto">
        <ChatInterface
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          onNewChat={handleNewChat}
          onRequireAuth={handleOpenAuth}
          onMovieClick={handleMovieClick}
        />
      </main>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-400">Error</p>
              <p className="text-sm text-red-300/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-dark-200">
        <p>
          Powered by OpenAI & TMDB • Built with MERN Stack
        </p>
      </footer>
    </div>
  );
}

// Wrap the app with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
