const API_BASE_URL = 'http://localhost:3002';

// Generic API call helper
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    throw error;
  }
}

// Feed Endpoints
export const feedAPI = {
  getFeed: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/feed?${queryString}`);
  },

  getPost: (postId) => apiCall(`/feed/${postId}`),

  getAuthorPosts: (author) => apiCall(`/feed/author/${author}`),

  getTrending: () => apiCall('/feed/trending'),
  createPost: (post) => apiCall('/posts', { method: 'POST', body: JSON.stringify(post) }),
};

// PDS Endpoints
export const pdsAPI = {
  getStatus: () => apiCall('/pds/status'),

  getPeers: () => apiCall('/pds/peers'),

  getStorage: () => apiCall('/pds/storage'),

  sync: (dataHash) => apiCall('/pds/sync', {
    method: 'POST',
    body: JSON.stringify({ dataHash }),
  }),

  publish: (content) => apiCall('/pds/publish', {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
};

// Knowledge Graph Endpoints
export const graphAPI = {
  getStatus: () => apiCall('/graph/status'),

  query: (query) => apiCall('/graph/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  }),

  getGaps: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/graph/gaps?${queryString}`);
  },

  getNode: (nodeId, depth = 1) => apiCall(`/graph/node/${nodeId}?depth=${depth}`),

  getPath: (startId, endId) => apiCall(`/graph/path/${startId}/${endId}`),

  addNode: (node) => apiCall('/graph/node', {
    method: 'POST',
    body: JSON.stringify(node),
  }),

  connectNodes: (nodeId1, nodeId2) => apiCall('/graph/connect', {
    method: 'POST',
    body: JSON.stringify({ nodeId1, nodeId2 }),
  }),
};

// GitHub Integration Endpoints
export const githubAPI = {
  getRepo: (repo) => apiCall(`/github/${repo}`),

  getMultipleRepos: (repos) => apiCall('/github/multiple', {
    method: 'POST',
    body: JSON.stringify({ repos }),
  }),

  getTopRepos: (limit, sortBy = 'stars') => apiCall(`/github/top/${limit}?sortBy=${sortBy}`),

  getRepoHealth: (repo) => apiCall(`/github/health/${repo}`),
};

// Scoring Endpoints
export const scoringAPI = {
  calculateNovelty: (post) => apiCall('/score/novelty', {
    method: 'POST',
    body: JSON.stringify({ post }),
  }),

  calculateImpact: (post) => apiCall('/score/impact', {
    method: 'POST',
    body: JSON.stringify({ post }),
  }),
};

// User Endpoints
export const userAPI = {
  getUsers: () => apiCall('/users'),

  getUser: (username) => apiCall(`/users/${username}`),
  follow: (targetUserId) => apiCall('/follow', { method: 'POST', body: JSON.stringify({ targetUserId }) }),
};