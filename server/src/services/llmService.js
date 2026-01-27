import OpenAI from 'openai';

class LLMService {
  constructor() {
    this._client = null;
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  }

  get client() {
    if (!this._client) {
      this._client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    return this._client;
  }

  /**
   * Generate a chat completion
   */
  async chat(messages, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1024,
        top_p: options.top_p || 0.9
      });

      return {
        content: response.choices[0].message.content,
        role: 'assistant'
      };
    } catch (error) {
      console.error('OpenAI Chat Error:', error.message);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * Generate a streaming chat completion
   */
  async *chatStream(messages, options = {}) {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1024,
        top_p: options.top_p || 0.9,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenAI Stream Error:', error.message);
      throw new Error(`Failed to stream response: ${error.message}`);
    }
  }

  /**
   * Generate a completion with tool calling support
   * OpenAI has native function calling support
   */
  async chatWithTools(messages, tools, options = {}) {
    // Convert tools to OpenAI function format
    const functions = tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));

    const systemPrompt = `You are a helpful movie recommendation assistant. You help users find movies based on their mood, preferences, and requests.

When users describe their mood or ask for movie recommendations:
1. Use the available tools to search for relevant movies
2. Provide personalized, conversational responses
3. Explain why each movie matches their request

Be friendly, enthusiastic about movies, and give thoughtful recommendations.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ],
        tools: functions,
        tool_choice: 'auto',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1024
      });

      const message = response.choices[0].message;

      // Check if the model wants to call a tool
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        return {
          type: 'tool_call',
          toolCall: {
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments)
          },
          rawContent: message.content || ''
        };
      }

      return {
        type: 'message',
        content: message.content
      };
    } catch (error) {
      console.error('OpenAI Tool Call Error:', error.message);
      throw new Error(`Failed to process with tools: ${error.message}`);
    }
  }

  /**
   * Check if OpenAI API is available
   */
  async isAvailable() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return false;
      }
      // Make a minimal API call to verify the key works
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Get available models
   */
  async listModels() {
    try {
      const response = await this.client.models.list();
      return response.data
        .filter(m => m.id.includes('gpt'))
        .map(m => ({
          name: m.id,
          created: m.created
        }));
    } catch (error) {
      console.error('Failed to list models:', error.message);
      return [];
    }
  }
}

export default new LLMService();
