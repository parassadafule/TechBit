import express from 'express';
// import { AtpAgent } from '@atproto/api'; // Placeholder: ATProto API not available
import { createFeedGenerator } from './feedGenerator/generator.js';
import { startPDS, getPDSStatus, getPeerList, getStorageInfo, syncData, publishContent } from './pds/server.js';
import { initGraph, addNode, connectNodes, findRelatedNodes } from './graph/builder.js';
import { queryGraph, queryKnowledgeGaps, queryNodeConnections, findPathBetweenNodes, graphQLStub } from './graph/query.js';
import { fetchGitHubStats, fetchMultipleRepos, getTopRepositories, calculateRepoHealth } from './integrations/github.js';
import { calculateNovelty } from './feedGenerator/scoring/novelty.js';
import { calculateImpact } from './feedGenerator/scoring/impact.js';
import { tryCallMlService } from './utils/index.js';
import { mockPosts, mockUsers } from './mockData.js';
import db from './db.js';

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables


const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// CORS Middleware - Allow requests from frontend
app.use((req, res, next) => {
  // Allow requests from any origin (for development)
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Allow specific HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }
  
  next();
});

// Basic route with comprehensive API documentation
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Techbit Backend API', 
    status: 'running',
    version: '1.0.0',
    endpoints: {
      general: [
        'GET / - API documentation'
      ],
      feed: [
        'GET /feed - Get ranked feed (params: limit, offset, sortBy, filterTags)',
        'GET /feed/:postId - Get specific post by ID',
        'GET /feed/author/:author - Get posts by author',
        'GET /feed/trending - Get trending tags'
      ],
      pds: [
        'GET /pds/status - Get PDS status and uptime',
        'GET /pds/peers - Get connected peer list',
        'GET /pds/storage - Get storage information',
        'POST /pds/sync - Sync data (body: { dataHash })',
        'POST /pds/publish - Publish content (body: { content })'
      ],
      graph: [
        'GET /graph/status - Get graph initialization status',
        'POST /graph/query - Query the knowledge graph (body: { query })',
        'POST /graph/graphql - GraphQL-like stub (body: { queryObject })',
        'GET /graph/gaps - Get knowledge gaps (params: minRelevance, topics, limit)',
        'GET /graph/node/:nodeId - Get node connections (params: depth)',
        'GET /graph/path/:startId/:endId - Find path between nodes',
        'POST /graph/node - Add new node (body: { id, label, type, connections })',
        'POST /graph/connect - Connect two nodes (body: { nodeId1, nodeId2 })'
      ],
      github: [
        'GET /github/:repo - Get GitHub stats for repository',
        'POST /github/multiple - Get stats for multiple repos (body: { repos })',
        'GET /github/top/:limit - Get top repositories (params: sortBy)',
        'GET /github/health/:repo - Calculate repository health score'
      ],
      scoring: [
        'POST /score/novelty - Calculate novelty score (body: { post })',
        'POST /score/impact - Calculate impact score (body: { post })',
        'POST /ml/novelty - Proxy to ML novelty scorer (body: { text })',
        'POST /rag/retrieve - Retrieve docs and summary (body: { query })'
      ],
      federated: [
        'GET /federated/status - Get federated learning status',
        'POST /federated/report - Report local training metrics (body: { metrics })'
      ],
      users: [
        'GET /users - Get all users',
        'GET /users/:username - Get user profile'
      ]
    }
  });
});

// Feed endpoints
app.get('/feed', async (req, res) => {
  try {
    const { limit, offset, sortBy, filterTags } = req.query;
    const params = {
      limit: limit ? parseInt(limit) : 10,
      offset: offset ? parseInt(offset) : 0,
      sortBy: sortBy || 'score',
      filterTags: filterTags ? filterTags.split(',') : []
    };
    
    const feedGenerator = createFeedGenerator(null);
    const result = await feedGenerator.getFeed(params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/feed/:postId', async (req, res) => {
  try {
    const feedGenerator = createFeedGenerator(null);
    const result = await feedGenerator.getPostById(req.params.postId);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.get('/feed/author/:author', async (req, res) => {
  try {
    const feedGenerator = createFeedGenerator(null);
    const result = await feedGenerator.getPostsByAuthor(req.params.author);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/feed/trending', async (req, res) => {
  try {
    const feedGenerator = createFeedGenerator(null);
    const result = await feedGenerator.getTrendingTags();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PDS endpoints
app.get('/pds/status', (req, res) => {
  try {
    const status = getPDSStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/pds/peers', (req, res) => {
  try {
    const peers = getPeerList();
    res.json(peers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/pds/storage', (req, res) => {
  try {
    const storage = getStorageInfo();
    res.json(storage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/pds/sync', async (req, res) => {
  try {
    const { dataHash } = req.body;
    if (!dataHash) {
      return res.status(400).json({ error: 'dataHash is required' });
    }
    const result = await syncData(dataHash);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/pds/publish', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }
    const result = await publishContent(content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Graph endpoints
app.get('/graph/status', (req, res) => {
  res.json({ 
    status: 'initialized',
    message: 'Knowledge graph is ready',
    timestamp: new Date().toISOString()
  });
});

app.post('/graph/query', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }
    const result = queryGraph(query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/graph/graphql', (req, res) => {
  try {
    const { queryObject } = req.body || {};
    if (!queryObject) return res.status(400).json({ error: 'queryObject is required' });
    const result = graphQLStub(queryObject);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/graph/gaps', (req, res) => {
  try {
    const { minRelevance, topics, limit } = req.query;
    const filters = {
      minRelevance: minRelevance ? parseFloat(minRelevance) : undefined,
      topics: topics ? topics.split(',') : undefined,
      limit: limit ? parseInt(limit) : undefined
    };
    const result = queryKnowledgeGaps(filters);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/graph/node/:nodeId', (req, res) => {
  try {
    const { depth } = req.query;
    const result = queryNodeConnections(
      req.params.nodeId, 
      depth ? parseInt(depth) : 1
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/graph/path/:startId/:endId', (req, res) => {
  try {
    const result = findPathBetweenNodes(req.params.startId, req.params.endId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/graph/node', (req, res) => {
  try {
    const result = addNode(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/graph/connect', (req, res) => {
  try {
    const { nodeId1, nodeId2 } = req.body;
    if (!nodeId1 || !nodeId2) {
      return res.status(400).json({ error: 'nodeId1 and nodeId2 are required' });
    }
    const result = connectNodes(nodeId1, nodeId2);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GitHub integration endpoints
app.get('/github/:repo(*)', async (req, res) => {
  try {
    const repo = req.params.repo;
    const stats = await fetchGitHubStats(repo);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/github/multiple', async (req, res) => {
  try {
    const { repos } = req.body;
    if (!repos || !Array.isArray(repos)) {
      return res.status(400).json({ error: 'repos array is required' });
    }
    const result = await fetchMultipleRepos(repos);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/github/top/:limit', (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 5;
    const { sortBy } = req.query;
    const result = getTopRepositories(limit, sortBy || 'stars');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/github/health/:repo(*)', (req, res) => {
  try {
    const repo = req.params.repo;
    const result = calculateRepoHealth(repo);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scoring endpoints
app.post('/score/novelty', (req, res) => {
  try {
    const { post } = req.body;
    if (!post) {
      return res.status(400).json({ error: 'post object is required' });
    }
    const score = calculateNovelty(post);
    res.json({ score: score.toFixed(2), post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/score/impact', (req, res) => {
  try {
    const { post } = req.body;
    if (!post) {
      return res.status(400).json({ error: 'post object is required' });
    }
    const score = calculateImpact(post);
    res.json({ score: score.toFixed(2), post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ML novelty proxy
app.post('/ml/novelty', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    const result = await tryCallMlService('/score', { text }, { score: null });
    if (result && typeof result.score === 'number') {
      return res.json({ score: result.score });
    }
    return res.status(503).json({ error: 'ML service unavailable' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Minimal RAG endpoint (stub; would call ml-service retriever/summarizer)
app.post('/rag/retrieve', async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }
    // Attempt ML service; if unavailable, return stub data
    const result = await tryCallMlService('/rag/retrieve', { query }, null);
    if (result) {
      return res.json(result);
    }
    return res.json({ documents: [], summary: null, note: 'RAG service unavailable' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Federated learning hooks (stubs)
app.get('/federated/status', (req, res) => {
  res.json({
    server: 'offline',
    clients: 0,
    lastAggregation: null,
    note: 'Hook up to Flower or a federated server to enable.'
  });
});

app.post('/federated/report', (req, res) => {
  const { metrics } = req.body || {};
  if (!metrics) return res.status(400).json({ error: 'metrics are required' });
  // In a real setup, forward to federated coordinator
  res.json({ received: true, metrics });
});

// User endpoints
app.get('/users', (req, res) => {
  res.json({ 
    users: Object.entries(mockUsers).map(([username, data]) => ({
      username,
      ...data
    })),
    count: Object.keys(mockUsers).length
  });
});

app.get('/users/:username', (req, res) => {
  const user = mockUsers[req.params.username];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ 
    username: req.params.username,
    ...user
  });
});

// Initialize ATProto agent
// const agent = new AtpAgent({ service: 'https://bsky.social' }); // Placeholder

// Start services
async function startServer() {
  try {
    // await agent.login({ identifier: process.env.BSKY_USERNAME, password: process.env.BSKY_PASSWORD });
    
    // Start PDS
    await startPDS();
    
    // Init knowledge graph
    await initGraph();
    
    app.listen(port, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`✓ Techbit Backend Server Running`);
      console.log(`${'='.repeat(50)}`);
      console.log(`Port: ${port}`);
      console.log(`URL: http://localhost:${port}`);
      console.log(`API Docs: http://localhost:${port}/`);
      console.log(`${'='.repeat(50)}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);