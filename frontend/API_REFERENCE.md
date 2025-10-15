# Techbit Backend - API Reference

## Base URL
```
http://localhost:3002
```

---

## 📑 Table of Contents
1. [Feed Endpoints](#feed-endpoints)
2. [PDS Endpoints](#pds-endpoints)
3. [Knowledge Graph Endpoints](#knowledge-graph-endpoints)
4. [GitHub Integration Endpoints](#github-integration-endpoints)
5. [Scoring Endpoints](#scoring-endpoints)
6. [User Endpoints](#user-endpoints)

---

## Feed Endpoints

### GET /feed
Get ranked and filtered feed of posts.

**Query Parameters:**
- `limit` (number, optional, default: 10) - Number of posts to return
- `offset` (number, optional, default: 0) - Pagination offset
- `sortBy` (string, optional, default: 'score') - Sort method: 'score', 'timestamp', or 'likes'
- `filterTags` (string, optional) - Comma-separated tags to filter by

**Response:**
```json
{
  "feed": [
    {
      "post": {
        "id": "1",
        "text": "Post content...",
        "author": "username",
        "timestamp": "2025-10-15T10:00:00Z",
        "repo": "owner/repo",
        "tags": ["tag1", "tag2"],
        "likes": 142,
        "comments": 23,
        "shares": 18,
        "authorInfo": { ... }
      },
      "scores": {
        "novelty": "0.85",
        "impact": "0.72",
        "total": "1.57"
      },
      "score": 1.57
    }
  ],
  "metadata": {
    "total": 8,
    "limit": 10,
    "offset": 0,
    "sortBy": "score",
    "filterTags": []
  }
}
```

---

### GET /feed/:postId
Get a specific post by ID.

**URL Parameters:**
- `postId` (string) - Post identifier

**Response:**
```json
{
  "post": {
    "id": "1",
    "text": "...",
    "author": "username",
    ...
  },
  "scores": {
    "novelty": "0.85",
    "impact": "0.72"
  }
}
```

---

### GET /feed/author/:author
Get all posts by a specific author.

**URL Parameters:**
- `author` (string) - Author username

**Response:**
```json
{
  "posts": [ ... ],
  "authorInfo": {
    "name": "...",
    "reputation": 0.8,
    "specialties": ["..."],
    "followers": 1243
  },
  "count": 3
}
```

---

### GET /feed/trending
Get trending tags across all posts.

**Response:**
```json
{
  "trending": [
    { "tag": "quantum-computing", "count": 5 },
    { "tag": "blockchain", "count": 4 },
    ...
  ]
}
```

---

## PDS Endpoints

### GET /pds/status
Get Personal Data Server status and metrics.

**Response:**
```json
{
  "nodeId": "pds-node-001",
  "status": "running",
  "peers": ["peer-123", "peer-456", "peer-789"],
  "storage": {
    "total": "100GB",
    "used": "42GB",
    "available": "58GB"
  },
  "lastSync": "2025-10-15T10:30:00Z",
  "startTime": "2025-10-15T09:00:00Z",
  "uptime": "1h 30m 15s"
}
```

---

### GET /pds/peers
Get list of connected peers.

**Response:**
```json
{
  "peers": ["peer-123", "peer-456", "peer-789"],
  "count": 3,
  "nodeId": "pds-node-001"
}
```

---

### GET /pds/storage
Get storage information and usage.

**Response:**
```json
{
  "storage": {
    "total": "100GB",
    "used": "42GB",
    "available": "58GB"
  },
  "usagePercent": "42.0",
  "status": "ok"
}
```

---

### POST /pds/sync
Synchronize data across peers.

**Request Body:**
```json
{
  "dataHash": "QmXxx..."
}
```

**Response:**
```json
{
  "success": true,
  "dataHash": "QmXxx...",
  "syncTime": "2025-10-15T10:35:00Z",
  "peers": ["peer-123", "peer-456"]
}
```

---

### POST /pds/publish
Publish content to the P2P network.

**Request Body:**
```json
{
  "content": {
    "title": "...",
    "data": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "contentHash": "Qmabc123...",
  "size": 256,
  "timestamp": "2025-10-15T10:40:00Z",
  "replicatedTo": ["peer-123", "peer-456"]
}
```

---

## Knowledge Graph Endpoints

### GET /graph/status
Get knowledge graph initialization status.

**Response:**
```json
{
  "status": "initialized",
  "message": "Knowledge graph is ready",
  "timestamp": "2025-10-15T10:00:00Z"
}
```

---

### POST /graph/query
Query the knowledge graph with free text.

**Request Body:**
```json
{
  "query": "quantum blockchain"
}
```

**Response:**
```json
{
  "type": "knowledge-gaps",
  "data": [ ... ],
  "count": 3
}
```

---

### GET /graph/gaps
Get identified knowledge gaps with filtering.

**Query Parameters:**
- `minRelevance` (number, optional) - Minimum relevance score (0-1)
- `topics` (string, optional) - Comma-separated topics to filter by
- `limit` (number, optional) - Maximum number of results

**Response:**
```json
{
  "gaps": [
    {
      "id": "gap-1",
      "title": "Integration of quantum computing with blockchain consensus",
      "description": "...",
      "relevance": 0.92,
      "topics": ["quantum-computing", "blockchain", "consensus"]
    }
  ],
  "count": 5,
  "filters": { ... }
}
```

---

### GET /graph/node/:nodeId
Get node details and connections.

**URL Parameters:**
- `nodeId` (string) - Node identifier

**Query Parameters:**
- `depth` (number, optional, default: 1) - How many levels deep to traverse

**Response:**
```json
{
  "node": {
    "id": "node-1",
    "label": "Quantum Computing",
    "type": "technology",
    "connections": ["node-2", "node-4"]
  },
  "relatedNodes": [ ... ],
  "connectionCount": 5,
  "depth": 1
}
```

---

### GET /graph/path/:startId/:endId
Find path between two nodes in the graph.

**URL Parameters:**
- `startId` (string) - Starting node ID
- `endId` (string) - Target node ID

**Response:**
```json
{
  "found": true,
  "path": [
    { "id": "node-1", "label": "Quantum Computing", ... },
    { "id": "node-2", "label": "Blockchain", ... }
  ],
  "length": 1
}
```

---

### POST /graph/node
Add a new node to the graph.

**Request Body:**
```json
{
  "id": "node-9",
  "label": "Edge Computing",
  "type": "technology",
  "connections": ["node-1"]
}
```

**Response:**
```json
{
  "success": true,
  "node": { ... }
}
```

---

### POST /graph/connect
Create connection between two nodes.

**Request Body:**
```json
{
  "nodeId1": "node-1",
  "nodeId2": "node-9"
}
```

**Response:**
```json
{
  "success": true,
  "connection": ["node-1", "node-9"]
}
```

---

## GitHub Integration Endpoints

### GET /github/:repo
Get GitHub statistics for a repository.

**URL Parameters:**
- `repo` (string) - Repository in format 'owner/repo'

**Response:**
```json
{
  "success": true,
  "repo": "techguru/code-gen-ml",
  "forks": 45,
  "stars": 234,
  "issues": 12,
  "contributors": 8,
  "lastUpdate": "2025-10-14"
}
```

---

### POST /github/multiple
Get stats for multiple repositories.

**Request Body:**
```json
{
  "repos": [
    "owner1/repo1",
    "owner2/repo2"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "repositories": [ ... ]
}
```

---

### GET /github/top/:limit
Get top repositories ranked by metric.

**URL Parameters:**
- `limit` (number) - Number of repositories to return

**Query Parameters:**
- `sortBy` (string, optional, default: 'stars') - Sort by: 'stars', 'forks', or 'contributors'

**Response:**
```json
{
  "top": [
    {
      "repo": "p2penthusiast/p2p-share",
      "forks": 89,
      "stars": 312,
      "issues": 15,
      "contributors": 15
    }
  ],
  "sortBy": "stars",
  "limit": 5
}
```

---

### GET /github/health/:repo
Calculate repository health score.

**URL Parameters:**
- `repo` (string) - Repository in format 'owner/repo'

**Response:**
```json
{
  "repo": "quantumphys/qaoa-research",
  "healthScore": "87.3",
  "rating": "Excellent",
  "stats": { ... }
}
```

**Health Rating Scale:**
- 80-100: Excellent
- 60-79: Good
- 40-59: Fair
- 0-39: Poor

---

## Scoring Endpoints

### POST /score/novelty
Calculate novelty score for a post.

**Request Body:**
```json
{
  "post": {
    "text": "...",
    "tags": ["quantum-computing"],
    "timestamp": "2025-10-15T10:00:00Z",
    "comments": 10,
    "shares": 5
  }
}
```

**Response:**
```json
{
  "score": "0.87",
  "post": { ... }
}
```

**Novelty Factors:**
- Base score: 0.5
- Trending tags: +0.3 per tag (max +0.4)
- Content length: up to +0.15
- Recency: up to +0.2
- Engagement: up to +0.15

---

### POST /score/impact
Calculate impact score for a post.

**Request Body:**
```json
{
  "post": {
    "text": "...",
    "author": "quantumphys",
    "repo": "quantumphys/qaoa-research",
    "likes": 250,
    "shares": 50
  }
}
```

**Response:**
```json
{
  "score": "0.94",
  "post": { ... }
}
```

**Impact Factors:**
- Base score: 0.3
- GitHub stars: +0.001 per star
- GitHub forks: +0.0008 per fork
- Contributors: +0.01 per contributor
- Update freshness: up to +0.1
- Author reputation: up to +0.4
- Social likes: up to +0.15
- Shares: up to +0.1

---

## User Endpoints

### GET /users
Get all users in the system.

**Response:**
```json
{
  "users": [
    {
      "username": "techguru",
      "name": "Tech Guru",
      "reputation": 0.8,
      "specialties": ["machine-learning", "transformers"],
      "followers": 1243,
      "posts": 87
    }
  ],
  "count": 8
}
```

---

### GET /users/:username
Get specific user profile.

**URL Parameters:**
- `username` (string) - User identifier

**Response:**
```json
{
  "username": "quantumphys",
  "name": "Quantum Physicist",
  "reputation": 0.9,
  "specialties": ["quantum-computing", "algorithms"],
  "followers": 2156,
  "posts": 45
}
```

---

## Error Responses

All endpoints may return errors in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented (mock data environment).

## Authentication

Currently no authentication required (development environment).

---

*Last updated: October 15, 2025*
