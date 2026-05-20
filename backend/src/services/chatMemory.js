const conversations = new Map();

const MAX_MESSAGES = 10;

const normalizeConversationId = (conversationId) => String(conversationId || '').trim();

const ensureConversation = (conversationId) => {
  const id = normalizeConversationId(conversationId);
  if (!id) {
    return null;
  }

  if (!conversations.has(id)) {
    conversations.set(id, []);
  }

  return id;
};

const getChatHistory = (conversationId) => {
  const id = normalizeConversationId(conversationId);
  if (!id || !conversations.has(id)) {
    return [];
  }

  return conversations.get(id).slice();
};

const saveChatHistory = (conversationId, chatHistory = []) => {
  const id = normalizeConversationId(conversationId);
  if (!id) {
    return null;
  }

  const nextHistory = Array.isArray(chatHistory)
    ? chatHistory
        .filter((message) => message && typeof message.content === 'string')
        .map((message) => ({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content,
        }))
        .slice(-MAX_MESSAGES)
    : [];

  conversations.set(id, nextHistory);
  return nextHistory;
};

module.exports = {
  conversations,
  ensureConversation,
  getChatHistory,
  saveChatHistory,
};
