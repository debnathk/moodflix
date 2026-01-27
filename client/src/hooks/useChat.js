import { useState, useCallback } from 'react';
import { sendMessage as apiSendMessage, getConversation, createConversation } from '../services/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await apiSendMessage(message, conversationId);
      
      // Update conversation ID if new
      if (response.conversationId && response.conversationId !== conversationId) {
        setConversationId(response.conversationId);
      }

      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        movies: response.movies || [],
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

      return response;
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message. Please try again.');
      // Remove the user message if sending failed
      setMessages(prev => prev.slice(0, -1));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const loadConversation = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const conversation = await getConversation(id);
      setConversationId(id);
      setMessages(conversation.messages || []);
    } catch (err) {
      console.error('Load conversation error:', err);
      setError('Failed to load conversation.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const conversation = await createConversation();
      setConversationId(conversation.id);
      setMessages([]);
      return conversation;
    } catch (err) {
      console.error('Create conversation error:', err);
      setError('Failed to create conversation.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    conversationId,
    isLoading,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    clearChat
  };
}

export default useChat;
