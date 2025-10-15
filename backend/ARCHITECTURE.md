# Techbit Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      TECHBIT BACKEND API                         │
│                     http://localhost:3002                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Express Server                            │
│                        (src/index.js)                            │
└─────────────────────────────────────────────────────────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   Feed   │   │   Graph  │   │   PDS    │   │  GitHub  │
    │ Generator│   │  System  │   │  Server  │   │   API    │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FEED GENERATOR                            │
├─────────────────────────────────────────────────────────────────┤
│  • Get Feed (ranked, filtered, paginated)                       │
│  • Get Post by ID                                               │
│  • Get Posts by Author                                          │
│  • Get Trending Tags                                            │
│                                                                  │
│  ┌───────────────┐              ┌───────────────┐              │
│  │ Novelty Score │              │  Impact Score │              │
│  ├───────────────┤              ├───────────────┤              │
│  │ • Trending    │              │ • GitHub stats│              │
│  │ • Recency     │              │ • Author rep  │              │
│  │ • Engagement  │              │ • Social data │              │
│  │ • Content len │              │ • Freshness   │              │
│  └───────────────┘              └───────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE GRAPH                             │
├─────────────────────────────────────────────────────────────────┤
│  Graph Builder              │  Graph Query                      │
│  ├─ Initialize graph         │  ├─ Query nodes                  │
│  ├─ Add nodes               │  ├─ Find knowledge gaps           │
│  ├─ Connect nodes           │  ├─ Get connections               │
│  ├─ Find related nodes      │  ├─ Find paths                    │
│  └─ Traverse relationships  │  └─ Filter by topics              │
│                                                                  │
│  Data: 8 Nodes, 5 Knowledge Gaps, Multiple Connections          │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                    P2P DATA SERVER (PDS)                         │
├─────────────────────────────────────────────────────────────────┤
│  • Status Monitoring        │  • Content Publishing             │
│  • Peer Management          │  • Data Synchronization           │
│  • Storage Tracking         │  • IPFS-style Hashing             │
│  • Uptime Calculation       │  • Replication Simulation         │
│                                                                  │
│  Simulates: IPFS + libp2p networking                            │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB INTEGRATION                            │
├─────────────────────────────────────────────────────────────────┤
│  • Fetch Repository Stats   │  • Calculate Health Score         │
│  • Multi-repo Queries        │  • Rank Repositories              │
│  • Track Metrics            │  • Monitor Updates                │
│                                                                  │
│  Metrics: Stars, Forks, Issues, Contributors, Last Update       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. Feed Generation Flow
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │  Client  │────▶│   API    │────▶│   Feed   │
   │  Request │     │ Endpoint │     │Generator │
   └──────────┘     └──────────┘     └──────────┘
                                           │
                                           ▼
                    ┌────────────────────────────────┐
                    │  1. Fetch posts from mockData  │
                    │  2. Filter by tags (optional)  │
                    │  3. Calculate scores           │
                    │  4. Sort by criteria           │
                    │  5. Apply pagination           │
                    │  6. Enrich with author info    │
                    └────────────────────────────────┘
                                           │
                                           ▼
                    ┌─────────────────────────────────┐
                    │  Novelty Score + Impact Score   │
                    └─────────────────────────────────┘
                                           │
                                           ▼
                    ┌─────────────────────────────────┐
                    │  Ranked & Filtered Feed         │
                    │  with Metadata                  │
                    └─────────────────────────────────┘
```

```
2. Scoring Flow
   ┌──────────┐
   │   Post   │
   └──────────┘
        │
        ├─────────────────────────────┬──────────────────────────┐
        ▼                             ▼                          ▼
   ┌─────────┐                  ┌─────────┐              ┌─────────┐
   │ Novelty │                  │ Impact  │              │  Final  │
   │ Scoring │                  │ Scoring │              │  Score  │
   └─────────┘                  └─────────┘              └─────────┘
        │                             │                          ▲
        │                             │                          │
        ▼                             ▼                          │
   • Trending tags            • GitHub stats              Sum both scores
   • Recency                  • Author reputation               │
   • Engagement               • Social signals                  │
   • Content length           • Freshness                       │
        │                             │                          │
        └─────────────────────────────┴──────────────────────────┘
```

```
3. Knowledge Graph Flow
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │   User   │────▶│  Query   │────▶│  Graph   │
   │  Query   │     │ Endpoint │     │  System  │
   └──────────┘     └──────────┘     └──────────┘
                                           │
                                           ▼
                    ┌────────────────────────────────┐
                    │  Search nodes by label/type    │
                    │  Find knowledge gaps           │
                    │  Traverse relationships        │
                    │  Calculate paths               │
                    └────────────────────────────────┘
                                           │
                                           ▼
                    ┌─────────────────────────────────┐
                    │  Nodes, Gaps, or Paths          │
                    └─────────────────────────────────┘
```

## Mock Data Structure

```
mockData.js
├── mockPosts (8 items)
│   ├── id, text, author, timestamp
│   ├── repo, tags
│   └── likes, comments, shares
│
├── mockGitHubStats (8 repos)
│   ├── forks, stars, issues
│   ├── contributors
│   └── lastUpdate
│
├── mockKnowledgeGaps (5 items)
│   ├── id, title, description
│   ├── relevance (0-1)
│   └── topics[]
│
├── mockUsers (8 users)
│   ├── name, reputation
│   ├── specialties[]
│   └── followers, posts
│
├── techTrends (24 technologies)
│   └── trend_score (0-1)
│
├── mockGraphNodes (8 nodes)
│   ├── id, label, type
│   └── connections[]
│
└── mockPDSData
    ├── nodeId, status, peers
    └── storage (total, used, available)
```

## Request/Response Flow

```
HTTP Request
     │
     ▼
┌─────────────────┐
│ Express Router  │
└─────────────────┘
     │
     ├─── Validation
     ├─── Parse params/body
     └─── Route to handler
          │
          ▼
┌─────────────────┐
│ Business Logic  │
│ (Controllers)   │
└─────────────────┘
     │
     ├─── Fetch from mockData
     ├─── Apply algorithms
     ├─── Transform data
     └─── Format response
          │
          ▼
┌─────────────────┐
│ JSON Response   │
└─────────────────┘
     │
     ▼
HTTP Response
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         TESTING LAYERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Unit Tests (Jest)                                              │
│  ├── Feed generation logic                                      │
│  ├── Scoring algorithms                                         │
│  ├── Ranking & sorting                                          │
│  └── Data transformations                                       │
│                                                                  │
│  Integration Tests (API Tests)                                  │
│  ├── All 30+ endpoints                                          │
│  ├── Query parameters                                           │
│  ├── Request bodies                                             │
│  └── Response validation                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
backend/
│
├── src/
│   ├── index.js                    # Main server (30+ endpoints)
│   ├── mockData.js                 # All mock data
│   │
│   ├── feedGenerator/
│   │   ├── generator.js            # Feed logic
│   │   └── scoring/
│   │       ├── novelty.js          # Novelty algorithm
│   │       └── impact.js           # Impact algorithm
│   │
│   ├── graph/
│   │   ├── builder.js              # Graph management
│   │   └── query.js                # Graph queries
│   │
│   ├── integrations/
│   │   └── github.js               # GitHub integration
│   │
│   ├── pds/
│   │   └── server.js               # P2P data server
│   │
│   └── utils/
│       └── index.js                # Utility functions
│
├── tests/
│   └── feedGenerator.test.js      # Test suite
│
├── examples/
│   └── api-tests.js                # API integration tests
│
├── package.json                    # Dependencies & scripts
├── .env.example                    # Configuration template
├── .gitignore                      # Git ignore rules
│
└── Documentation/
    ├── README.md                   # Main documentation
    ├── QUICKSTART.md               # Quick start guide
    ├── API_REFERENCE.md            # API documentation
    ├── IMPLEMENTATION_SUMMARY.md   # Summary of work
    └── ARCHITECTURE.md             # This file
```

## Technology Dependencies

```
Production Dependencies:
├── express (^4.18.0)          - Web framework
├── @atproto/api (^0.1.0)      - ATProto SDK (for future use)
├── ipfs-http-client (^56.0.0) - IPFS client (for future use)
├── libp2p (^0.40.0)            - P2P networking (for future use)
├── graphql (^16.0.0)           - GraphQL (for future use)
└── neo4j-driver (^5.0.0)       - Neo4j driver (for future use)

Development Dependencies:
└── jest (^29.0.0)              - Testing framework
```

## Performance Characteristics

```
Response Times (Mock Data):
├── GET /feed                 : ~10-50ms
├── GET /feed/:postId        : ~5-10ms
├── POST /graph/query        : ~5-15ms
├── GET /github/:repo        : ~100ms (simulated delay)
└── POST /score/*            : ~5-10ms

Data Volume:
├── Posts: 8 items
├── Users: 8 items
├── Repos: 8 items
├── Graph Nodes: 8 items
└── Knowledge Gaps: 5 items

Endpoints: 30+
```

---

**Architecture Status**: ✅ Complete and Functional

*This architecture provides a solid foundation for the Techbit platform with clean separation of concerns, comprehensive features, and room for growth.*
