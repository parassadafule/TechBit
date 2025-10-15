# Techbit Backend API

A fully functional backend API for the Techbit platform with comprehensive mock data features for feed generation, knowledge graph management, P2P data storage, and GitHub integration.

## Features

### 🚀 Feed Generation
- Intelligent ranking using novelty and impact scoring algorithms
- Pagination and filtering by tags
- Author-based post retrieval
- Trending tag analysis
- Social engagement metrics

### 📊 Knowledge Graph
- Node management (add, connect, query)
- Knowledge gap identification
- Path finding between concepts
- Relationship traversal
- Topic-based filtering

### 🔗 P2P Data Server (PDS)
- Peer connection management
- Storage monitoring
- Data synchronization
- Content publishing with IPFS-style hashing
- Uptime tracking

### 🐙 GitHub Integration
- Repository statistics (stars, forks, issues, contributors)
- Multiple repository batch queries
- Top repository rankings
- Repository health scoring
- Integration with impact scoring

### 🎯 Scoring Systems
- **Novelty Score**: Based on trending topics, recency, engagement, and content length
- **Impact Score**: Combines GitHub metrics, author reputation, and social signals

## Installation

```bash
npm install
```

## Running the Server

```bash
npm start
# or
npm run dev
```

Server will run on `http://localhost:3002`

## Testing

```bash
npm test
```

## API Endpoints

### General
- `GET /` - API documentation and endpoint list

### Feed Endpoints
- `GET /feed` - Get ranked feed
  - Query params: `limit`, `offset`, `sortBy` (score|timestamp|likes), `filterTags`
- `GET /feed/:postId` - Get specific post by ID
- `GET /feed/author/:author` - Get posts by author
- `GET /feed/trending` - Get trending tags

### PDS Endpoints
- `GET /pds/status` - Get PDS status and uptime
- `GET /pds/peers` - Get connected peer list
- `GET /pds/storage` - Get storage information
- `POST /pds/sync` - Sync data
  - Body: `{ "dataHash": "string" }`
- `POST /pds/publish` - Publish content
  - Body: `{ "content": {} }`

### Knowledge Graph Endpoints
- `GET /graph/status` - Get graph initialization status
- `POST /graph/query` - Query the knowledge graph
  - Body: `{ "query": "string" }`
- `GET /graph/gaps` - Get knowledge gaps
  - Query params: `minRelevance`, `topics`, `limit`
- `GET /graph/node/:nodeId` - Get node connections
  - Query params: `depth`
- `GET /graph/path/:startId/:endId` - Find path between nodes
- `POST /graph/node` - Add new node
  - Body: `{ "id": "string", "label": "string", "type": "string", "connections": [] }`
- `POST /graph/connect` - Connect two nodes
  - Body: `{ "nodeId1": "string", "nodeId2": "string" }`

### GitHub Integration Endpoints
- `GET /github/:repo` - Get GitHub stats for repository (e.g., `/github/owner/repo`)
- `POST /github/multiple` - Get stats for multiple repos
  - Body: `{ "repos": ["owner/repo1", "owner/repo2"] }`
- `GET /github/top/:limit` - Get top repositories
  - Query params: `sortBy` (stars|forks|contributors)
- `GET /github/health/:repo` - Calculate repository health score

### Scoring Endpoints
- `POST /score/novelty` - Calculate novelty score
  - Body: `{ "post": {} }`
- `POST /score/impact` - Calculate impact score
  - Body: `{ "post": {} }`

### User Endpoints
- `GET /users` - Get all users
- `GET /users/:username` - Get user profile

## Example Usage

### Get Ranked Feed
```bash
curl http://localhost:3002/feed?limit=5&sortBy=score
```

### Filter Feed by Tags
```bash
curl http://localhost:3002/feed?filterTags=blockchain,quantum-computing
```

### Query Knowledge Gaps
```bash
curl http://localhost:3002/graph/gaps?minRelevance=0.85&limit=3
```

### Get GitHub Stats
```bash
curl http://localhost:3002/github/techguru/code-gen-ml
```

### Calculate Repository Health
```bash
curl http://localhost:3002/github/health/quantumphys/qaoa-research
```

### Publish Content to PDS
```bash
curl -X POST http://localhost:3002/pds/publish \
  -H "Content-Type: application/json" \
  -d '{"content": {"title": "New Research", "data": "Lorem ipsum"}}'
```

### Query Knowledge Graph
```bash
curl -X POST http://localhost:3002/graph/query \
  -H "Content-Type: application/json" \
  -d '{"query": "quantum blockchain"}'
```

## Mock Data

The backend includes comprehensive mock data:

### Posts (8 posts)
- Machine learning and transformers
- Blockchain and decentralized identity
- Quantum computing algorithms
- P2P file sharing systems
- Performance benchmarks
- Zero-knowledge proofs
- WebAssembly comparisons
- Distributed databases with CRDTs

### Users (8 users)
- Different reputation scores
- Specialties and followers
- Post counts and engagement metrics

### GitHub Repositories
- Stars, forks, issues, contributors
- Last update timestamps
- Integration with impact scoring

### Knowledge Gaps
- 5 identified research gaps
- Relevance scores
- Topic associations

### Graph Nodes
- 8 interconnected technology nodes
- Relationships between concepts
- Type classification (technology, concept, domain)

## Scoring Algorithms

### Novelty Score (0-1)
- **Base Score**: 0.5
- **Trending Tags**: +0.3 per trending tag (max 0.4)
- **Content Length**: Up to +0.15
- **Recency Bonus**: Up to +0.2 (decays over 24 hours)
- **Engagement**: Up to +0.15

### Impact Score (0-1)
- **Base Score**: 0.3
- **GitHub Stars**: +0.001 per star
- **GitHub Forks**: +0.0008 per fork
- **Contributors**: +0.01 per contributor
- **Freshness**: Up to +0.1 (decays over 7 days)
- **Author Reputation**: Up to +0.4
- **Social Likes**: Up to +0.15
- **Shares**: Up to +0.1

## Architecture

```
backend/
├── src/
│   ├── index.js                 # Main Express server
│   ├── mockData.js              # Comprehensive mock data
│   ├── feedGenerator/
│   │   ├── generator.js         # Feed generation logic
│   │   └── scoring/
│   │       ├── novelty.js       # Novelty scoring algorithm
│   │       └── impact.js        # Impact scoring algorithm
│   ├── graph/
│   │   ├── builder.js           # Graph construction and management
│   │   └── query.js             # Graph query functions
│   ├── integrations/
│   │   └── github.js            # GitHub API integration
│   ├── pds/
│   │   └── server.js            # P2P data server
│   └── utils/
│       └── index.js             # Utility functions
├── tests/
│   └── feedGenerator.test.js    # Comprehensive test suite
├── package.json
└── README.md
```

## Technologies

- **Express.js** - Web framework
- **Node.js** - Runtime environment
- **Jest** - Testing framework
- **Mock Data** - Simulated ATProto, IPFS, Neo4j, GitHub APIs

## Future Enhancements

- Real ATProto integration
- IPFS/libp2p implementation
- Neo4j graph database
- GitHub API integration
- Machine learning for scoring
- WebSocket support for real-time updates

## License

MIT
