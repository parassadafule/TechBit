// API Testing Examples for Techbit Backend
// You can run these using Node.js or import into testing tools

const BASE_URL = 'http://localhost:3002';

// Example 1: Get the full feed with default settings
async function testGetFeed() {
  console.log('\n--- Testing GET /feed ---');
  const response = await fetch(`${BASE_URL}/feed`);
  const data = await response.json();
  console.log('Feed items:', data.feed.length);
  console.log('First post:', data.feed[0]);
  return data;
}

// Example 2: Get feed with pagination and filtering
async function testGetFeedWithFilters() {
  console.log('\n--- Testing GET /feed with filters ---');
  const params = new URLSearchParams({
    limit: '5',
    offset: '0',
    sortBy: 'score',
    filterTags: 'blockchain,quantum-computing'
  });
  
  const response = await fetch(`${BASE_URL}/feed?${params}`);
  const data = await response.json();
  console.log('Filtered feed:', data.feed.length, 'items');
  console.log('Metadata:', data.metadata);
  return data;
}

// Example 3: Get trending tags
async function testGetTrendingTags() {
  console.log('\n--- Testing GET /feed/trending ---');
  const response = await fetch(`${BASE_URL}/feed/trending`);
  const data = await response.json();
  console.log('Trending tags:', data.trending);
  return data;
}

// Example 4: Get specific post by ID
async function testGetPostById() {
  console.log('\n--- Testing GET /feed/:postId ---');
  const response = await fetch(`${BASE_URL}/feed/3`);
  const data = await response.json();
  console.log('Post:', data.post.text);
  console.log('Scores:', data.scores);
  return data;
}

// Example 5: Get posts by author
async function testGetPostsByAuthor() {
  console.log('\n--- Testing GET /feed/author/:author ---');
  const response = await fetch(`${BASE_URL}/feed/author/techguru`);
  const data = await response.json();
  console.log('Author posts:', data.count);
  console.log('Author info:', data.authorInfo);
  return data;
}

// Example 6: Query knowledge graph
async function testQueryGraph() {
  console.log('\n--- Testing POST /graph/query ---');
  const response = await fetch(`${BASE_URL}/graph/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'quantum blockchain' })
  });
  const data = await response.json();
  console.log('Query results:', data);
  return data;
}

// Example 7: Get knowledge gaps
async function testGetKnowledgeGaps() {
  console.log('\n--- Testing GET /graph/gaps ---');
  const params = new URLSearchParams({
    minRelevance: '0.85',
    limit: '3'
  });
  
  const response = await fetch(`${BASE_URL}/graph/gaps?${params}`);
  const data = await response.json();
  console.log('Knowledge gaps found:', data.count);
  console.log('Gaps:', data.gaps);
  return data;
}

// Example 8: Get node connections
async function testGetNodeConnections() {
  console.log('\n--- Testing GET /graph/node/:nodeId ---');
  const response = await fetch(`${BASE_URL}/graph/node/node-1?depth=2`);
  const data = await response.json();
  console.log('Node:', data.node.label);
  console.log('Related nodes:', data.relatedNodes.length);
  return data;
}

// Example 9: Find path between nodes
async function testFindPath() {
  console.log('\n--- Testing GET /graph/path/:startId/:endId ---');
  const response = await fetch(`${BASE_URL}/graph/path/node-1/node-8`);
  const data = await response.json();
  console.log('Path found:', data.found);
  if (data.found) {
    console.log('Path length:', data.length);
    console.log('Path:', data.path.map(n => n.label).join(' -> '));
  }
  return data;
}

// Example 10: Get GitHub stats
async function testGetGitHubStats() {
  console.log('\n--- Testing GET /github/:repo ---');
  const response = await fetch(`${BASE_URL}/github/techguru/code-gen-ml`);
  const data = await response.json();
  console.log('GitHub stats:', data);
  return data;
}

// Example 11: Get multiple GitHub repos
async function testGetMultipleRepos() {
  console.log('\n--- Testing POST /github/multiple ---');
  const response = await fetch(`${BASE_URL}/github/multiple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repos: ['techguru/code-gen-ml', 'quantumphys/qaoa-research']
    })
  });
  const data = await response.json();
  console.log('Multiple repos:', data.count);
  console.log('Repositories:', data.repositories);
  return data;
}

// Example 12: Get top repositories
async function testGetTopRepos() {
  console.log('\n--- Testing GET /github/top/:limit ---');
  const response = await fetch(`${BASE_URL}/github/top/5?sortBy=stars`);
  const data = await response.json();
  console.log('Top repositories:', data.top);
  return data;
}

// Example 13: Get repository health
async function testGetRepoHealth() {
  console.log('\n--- Testing GET /github/health/:repo ---');
  const response = await fetch(`${BASE_URL}/github/health/quantumphys/qaoa-research`);
  const data = await response.json();
  console.log('Repository health:', data.healthScore, `(${data.rating})`);
  return data;
}

// Example 14: Get PDS status
async function testGetPDSStatus() {
  console.log('\n--- Testing GET /pds/status ---');
  const response = await fetch(`${BASE_URL}/pds/status`);
  const data = await response.json();
  console.log('PDS status:', data.status);
  console.log('Uptime:', data.uptime);
  return data;
}

// Example 15: Publish content to PDS
async function testPublishContent() {
  console.log('\n--- Testing POST /pds/publish ---');
  const response = await fetch(`${BASE_URL}/pds/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: {
        title: 'New Research Paper',
        data: 'Lorem ipsum dolor sit amet...'
      }
    })
  });
  const data = await response.json();
  console.log('Published:', data.contentHash);
  console.log('Replicated to:', data.replicatedTo);
  return data;
}

// Example 16: Calculate novelty score
async function testCalculateNovelty() {
  console.log('\n--- Testing POST /score/novelty ---');
  const response = await fetch(`${BASE_URL}/score/novelty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post: {
        text: 'Testing quantum machine learning algorithms',
        tags: ['quantum-computing', 'machine-learning'],
        timestamp: new Date().toISOString(),
        comments: 10,
        shares: 5
      }
    })
  });
  const data = await response.json();
  console.log('Novelty score:', data.score);
  return data;
}

// Example 17: Calculate impact score
async function testCalculateImpact() {
  console.log('\n--- Testing POST /score/impact ---');
  const response = await fetch(`${BASE_URL}/score/impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post: {
        text: 'Major breakthrough announcement',
        author: 'quantumphys',
        repo: 'quantumphys/qaoa-research',
        likes: 250,
        shares: 50
      }
    })
  });
  const data = await response.json();
  console.log('Impact score:', data.score);
  return data;
}

// Example 18: Get all users
async function testGetAllUsers() {
  console.log('\n--- Testing GET /users ---');
  const response = await fetch(`${BASE_URL}/users`);
  const data = await response.json();
  console.log('Total users:', data.count);
  console.log('Users:', data.users.map(u => u.username).join(', '));
  return data;
}

// Example 19: Get specific user
async function testGetUser() {
  console.log('\n--- Testing GET /users/:username ---');
  const response = await fetch(`${BASE_URL}/users/quantumphys`);
  const data = await response.json();
  console.log('User:', data.name);
  console.log('Reputation:', data.reputation);
  console.log('Followers:', data.followers);
  return data;
}

// Run all tests
async function runAllTests() {
  console.log('====================================');
  console.log('TECHBIT BACKEND API TESTS');
  console.log('====================================');
  
  try {
    await testGetFeed();
    await testGetFeedWithFilters();
    await testGetTrendingTags();
    await testGetPostById();
    await testGetPostsByAuthor();
    await testQueryGraph();
    await testGetKnowledgeGaps();
    await testGetNodeConnections();
    await testFindPath();
    await testGetGitHubStats();
    await testGetMultipleRepos();
    await testGetTopRepos();
    await testGetRepoHealth();
    await testGetPDSStatus();
    await testPublishContent();
    await testCalculateNovelty();
    await testCalculateImpact();
    await testGetAllUsers();
    await testGetUser();
    
    console.log('\n====================================');
    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('====================================\n');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export for use in other files or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  testGetFeed,
  testGetFeedWithFilters,
  testGetTrendingTags,
  testGetPostById,
  testGetPostsByAuthor,
  testQueryGraph,
  testGetKnowledgeGaps,
  testGetNodeConnections,
  testFindPath,
  testGetGitHubStats,
  testGetMultipleRepos,
  testGetTopRepos,
  testGetRepoHealth,
  testGetPDSStatus,
  testPublishContent,
  testCalculateNovelty,
  testCalculateImpact,
  testGetAllUsers,
  testGetUser,
  runAllTests
};
