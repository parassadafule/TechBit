import api from '../lib/axios';

export const authAPI = {
  checkAuth: async () => {
    const response = await api.get('/auth/status');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getGoogleLoginUrl: () => `${api.defaults.baseURL.replace('/api', '')}/api/auth/google`,
  getGithubLoginUrl: () => `${api.defaults.baseURL.replace('/api', '')}/api/auth/github`,
};

export const userAPI = {
  getProfile: async (userId) => {
    const response = await api.get(`/users/profile/${userId || ''}`);
    return response.data;
  },

  getUserPosts: async (userId, page = 1, limit = 20) => {
    const response = await api.get(`/users/${userId}/posts`, {
      params: { page, limit },
    });
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  getActivity: async (page = 1, limit = 20) => {
    const response = await api.get('/users/activity', {
      params: { page, limit },
    });
    return response.data;
  },

  addActivity: async (action, postId) => {
    const response = await api.post('/users/activity', { action, postId });
    return response.data;
  },

  getSuggestedUsers: async (limit = 5) => {
    const response = await api.get('/users/suggested', {
      params: { limit },
    });
    return response.data;
  },
};

export const postAPI = {
  getFeed: async ({ page = 1, limit = 20, type, tags, sort = 'latest' } = {}) => {
    const response = await api.get('/posts/feed', {
      params: { page, limit, type, tags, sort },
    });
    return response.data;
  },

  getPost: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  createPost: async (data) => {
    const response = await api.post('/posts', data);
    return response.data;
  },

  uploadPost: async (url, type) => {
    const response = await api.post('/posts/upload', { url, type });
    return response.data;
  },

  updatePost: async (postId, data) => {
    const response = await api.put(`/posts/${postId}`, data);
    return response.data;
  },

  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  likePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  sharePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/share`);
    return response.data;
  },
};

export const searchAPI = {
  search: async ({ q, tags, type, semantic = false, page = 1, limit = 20 } = {}) => {
    const response = await api.get('/search', {
      params: { q, tags, type, semantic, page, limit },
    });
    return response.data;
  },

  filterByTags: async (tags, page = 1, limit = 20) => {
    const response = await api.get('/search/tags', {
      params: { tags, page, limit },
    });
    return response.data;
  },

  getRelated: async (postId) => {
    const response = await api.get(`/search/related/${postId}`);
    return response.data;
  },
};

export const commentAPI = {
  getComments: async (postId, page = 1, limit = 20) => {
    const response = await api.get(`/comments/${postId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  createComment: async (postId, text) => {
    const response = await api.post(`/comments/${postId}`, { text });
    return response.data;
  },

  updateComment: async (commentId, text) => {
    const response = await api.put(`/comments/${commentId}`, { text });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
};

export const aiAPI = {
  summarize: async (content, url, type) => {
    const response = await api.post('/ai/summarize', { content, url, type });
    return response.data;
  },

  summarizeMultimodal: async (inputs, focus) => {
    const response = await api.post('/ai/summarize-multimodal', { inputs, focus });
    return response.data;
  },

  query: async (query) => {
    const response = await api.post('/ai/query', { query });
    return response.data;
  },

  getBriefing: async ({ topics, refresh = false, days = 3 } = {}) => {
    const response = await api.get('/ai/briefing', {
      params: { topics, refresh, days },
    });
    return response.data;
  },

  getRecommendations: async () => {
    const response = await api.get('/ai/recommendations');
    return response.data;
  },
};

export const learningPathAPI = {
  getLearningPath: async () => {
    const response = await api.get('/learning-path');
    return response.data;
  },

  regenerate: async (payload = {}) => {
    const response = await api.post('/learning-path/regenerate', payload);
    return response.data;
  },

  completeItem: async (pathId, step) => {
    const response = await api.post(`/learning-path/${pathId}/complete/${step}`);
    return response.data;
  },
};

export const trendAPI = {
  getTrends: async ({ limit = 20, source = '' } = {}) => {
    const response = await api.get('/trends', {
      params: { limit, source: source || undefined },
    });
    return response.data;
  },

  fetchLatest: async () => {
    const response = await api.get('/trends/refresh');
    return response.data;
  },
};

export const notificationAPI = {
  getNotifications: async (page = 1, limit = 20, unread = false) => {
    const response = await api.get('/notifications', {
      params: { page, limit, unread: unread ? 'true' : undefined },
    });
    return response.data;
  },

  markAsRead: async (notifId) => {
    const response = await api.put(`/notifications/${notifId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notifId) => {
    const response = await api.delete(`/notifications/${notifId}`);
    return response.data;
  },
};
