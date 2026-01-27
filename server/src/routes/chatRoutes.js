import express from 'express';
import {
  sendMessage,
  getConversation,
  createConversation,
  deleteConversation,
  getStatus
} from '../controllers/chatController.js';

const router = express.Router();

// Get LLM (OpenAI) status
router.get('/status', getStatus);

// Create new conversation
router.post('/new', createConversation);

// Send message to chat
router.post('/', sendMessage);

// Get conversation by ID
router.get('/:conversationId', getConversation);

// Delete conversation
router.delete('/:conversationId', deleteConversation);

export default router;
