import agentService from '../services/agentService.js';
import llmService from '../services/llmService.js';

/**
 * Send a chat message and get AI response
 * POST /api/chat
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await agentService.chat(message, conversationId);

    res.json({
      conversationId: response.conversationId,
      message: response.message,
      movies: response.movies
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
};

/**
 * Get conversation history
 * GET /api/chat/:conversationId
 */
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await agentService.getConversation(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
};

/**
 * Create a new conversation
 * POST /api/chat/new
 */
export const createConversation = async (req, res) => {
  try {
    const conversation = await agentService.createConversation();
    res.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

/**
 * Delete a conversation
 * DELETE /api/chat/:conversationId
 */
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await agentService.deleteConversation(conversationId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

/**
 * Check if LLM (OpenAI) is available
 * GET /api/chat/status
 */
export const getStatus = async (req, res) => {
  try {
    const isAvailable = await llmService.isAvailable();

    res.json({
      llmAvailable: isAvailable,
      currentModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      provider: 'openai'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.json({
      llmAvailable: false,
      error: error.message
    });
  }
};
