# Quick Start Guide - Techbit Backend

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will start on `http://localhost:3002`

### 3. Test the API

Open your browser or use curl to test endpoints:

**Get API Documentation:**
```bash
curl http://localhost:3002/
```

**Get Ranked Feed:**
```bash
curl http://localhost:3002/feed
```

## 📝 Quick Examples

### Get Top 3 Posts
```bash
curl "http://localhost:3002/feed?limit=3&sortBy=score"
```

### Filter by Tags
```bash
curl "http://localhost:3002/feed?filterTags=quantum-computing,blockchain"
```

### Get Trending Tags
```bash
curl http://localhost:3002/feed/trending
```

### Get Knowledge Gaps
```bash
curl "http://localhost:3002/graph/gaps?minRelevance=0.85"
```

### Get GitHub Repository Stats
```bash
curl http://localhost:3002/github/techguru/code-gen-ml
```

### Get Top Repositories
```bash
curl "http://localhost:3002/github/top/5?sortBy=stars"
```

### Query Knowledge Graph
```bash
curl -X POST http://localhost:3002/graph/query \
  -H "Content-Type: application/json" \
  -d '{"query": "quantum"}'
```

### Calculate Post Score
```bash
curl -X POST http://localhost:3002/score/novelty \
  -H "Content-Type: application/json" \
  -d '{
    "post": {
      "text": "New quantum computing breakthrough",
      "tags": ["quantum-computing"],
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

### Get PDS Status
```bash
curl http://localhost:3002/pds/status
```

### Publish Content
```bash
curl -X POST http://localhost:3002/pds/publish \
  -H "Content-Type: application/json" \
  -d '{"content": {"title": "Test", "data": "Hello World"}}'
```

### Get All Users
```bash
curl http://localhost:3002/users
```

## 🧪 Run Automated Tests

### Unit Tests (Jest)
```bash
npm test
```

### API Integration Tests
```bash
# Make sure the server is running first (npm start)
# Then in another terminal:
npm run test:api
```

## 📊 Available Mock Data

### 8 Posts
- Covering topics: ML, blockchain, quantum computing, P2P, performance, ZK-proofs, WebAssembly, databases

### 8 Users
- Different reputation levels and specialties
- Followers and post counts

### 8 GitHub Repositories
- Stars, forks, issues, contributors
- Health scores and metrics

### 5 Knowledge Gaps
- Research opportunities
- Relevance scores

### 8 Graph Nodes
- Interconnected technology concepts
- Relationship mapping

## 🔧 Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key settings:
- `PORT=3002` - Server port
- `NODE_ENV=development` - Environment mode

## 📚 Learn More

See [README.md](README.md) for complete API documentation and architecture details.

## 💡 Tips

1. **Browse the API**: Visit `http://localhost:3002/` for the full endpoint list
2. **Check the Feed**: Start with `/feed` to see the ranking algorithm in action
3. **Explore the Graph**: Use `/graph/query` to search the knowledge graph
4. **Test Scoring**: Use `/score/novelty` and `/score/impact` to understand post ranking
5. **Monitor PDS**: Check `/pds/status` to see the P2P server simulation

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Change PORT in .env or:
PORT=3003 npm start
```

**Module not found?**
```bash
npm install
```

**Tests failing?**
```bash
# Make sure server is running for API tests
# Unit tests (npm test) don't require running server
```

## 🎯 Next Steps

1. ✅ Explore all API endpoints
2. ✅ Try different query parameters
3. ✅ Examine the scoring algorithms
4. ✅ Test the knowledge graph features
5. ✅ Review the mock data structure
6. ✅ Run the comprehensive test suite

Happy coding! 🚀
