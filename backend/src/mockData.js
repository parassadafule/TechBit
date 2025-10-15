// Mock data for Techbit backend demonstration

export const mockPosts = [
  {
    id: '1',
    text: 'Just released a new ML model for code generation using transformers. Check it out!',
    author: 'techguru',
    timestamp: '2025-10-15T10:00:00Z',
    repo: 'techguru/code-gen-ml',
    tags: ['machine-learning', 'transformers', 'code-generation'],
    likes: 142,
    comments: 23,
    shares: 18
  },
  {
    id: '2',
    text: 'Exploring decentralized identity solutions with DID and verifiable credentials',
    author: 'blockchaindev',
    timestamp: '2025-10-15T09:30:00Z',
    repo: 'blockchaindev/did-vc',
    tags: ['blockchain', 'identity', 'decentralized'],
    likes: 98,
    comments: 15,
    shares: 12
  },
  {
    id: '3',
    text: 'New breakthrough in quantum computing algorithms for optimization problems',
    author: 'quantumphys',
    timestamp: '2025-10-15T08:45:00Z',
    repo: 'quantumphys/qaoa-research',
    tags: ['quantum-computing', 'algorithms', 'optimization'],
    likes: 256,
    comments: 34,
    shares: 45
  },
  {
    id: '4',
    text: 'Building a P2P file sharing system using libp2p and IPFS',
    author: 'p2penthusiast',
    timestamp: '2025-10-15T08:00:00Z',
    repo: 'p2penthusiast/p2p-share',
    tags: ['p2p', 'ipfs', 'file-sharing'],
    likes: 187,
    comments: 28,
    shares: 22
  },
  {
    id: '5',
    text: 'Rust vs Go performance comparison for microservices architecture',
    author: 'backendexpert',
    timestamp: '2025-10-15T07:15:00Z',
    repo: 'backendexpert/rust-go-comp',
    tags: ['rust', 'go', 'microservices', 'performance'],
    likes: 134,
    comments: 19,
    shares: 16
  },
  {
    id: '6',
    text: 'Implementing zero-knowledge proofs in Solidity for privacy-preserving smart contracts',
    author: 'cryptowizard',
    timestamp: '2025-10-15T06:30:00Z',
    repo: 'cryptowizard/zk-solidity',
    tags: ['blockchain', 'zero-knowledge', 'solidity', 'privacy'],
    likes: 211,
    comments: 31,
    shares: 27
  },
  {
    id: '7',
    text: 'WebAssembly vs Native: Performance benchmarks for compute-intensive tasks',
    author: 'perfengineer',
    timestamp: '2025-10-15T05:45:00Z',
    repo: 'perfengineer/wasm-bench',
    tags: ['webassembly', 'performance', 'benchmarks'],
    likes: 89,
    comments: 12,
    shares: 9
  },
  {
    id: '8',
    text: 'Building distributed databases with eventual consistency using CRDTs',
    author: 'dbarchitect',
    timestamp: '2025-10-15T05:00:00Z',
    repo: 'dbarchitect/crdt-db',
    tags: ['databases', 'distributed-systems', 'crdts'],
    likes: 167,
    comments: 24,
    shares: 19
  }
];

export const mockGitHubStats = {
  'techguru/code-gen-ml': { forks: 45, stars: 234, issues: 12, contributors: 8, lastUpdate: '2025-10-14' },
  'blockchaindev/did-vc': { forks: 67, stars: 189, issues: 8, contributors: 12, lastUpdate: '2025-10-13' },
  'quantumphys/qaoa-research': { forks: 23, stars: 156, issues: 5, contributors: 5, lastUpdate: '2025-10-15' },
  'p2penthusiast/p2p-share': { forks: 89, stars: 312, issues: 15, contributors: 15, lastUpdate: '2025-10-12' },
  'backendexpert/rust-go-comp': { forks: 34, stars: 178, issues: 6, contributors: 6, lastUpdate: '2025-10-14' },
  'cryptowizard/zk-solidity': { forks: 56, stars: 289, issues: 9, contributors: 10, lastUpdate: '2025-10-15' },
  'perfengineer/wasm-bench': { forks: 28, stars: 145, issues: 4, contributors: 4, lastUpdate: '2025-10-13' },
  'dbarchitect/crdt-db': { forks: 41, stars: 201, issues: 7, contributors: 9, lastUpdate: '2025-10-14' }
};

export const mockKnowledgeGaps = [
  {
    id: 'gap-1',
    title: 'Integration of quantum computing with blockchain consensus',
    description: 'Exploring how quantum algorithms can enhance blockchain consensus mechanisms',
    relevance: 0.92,
    topics: ['quantum-computing', 'blockchain', 'consensus']
  },
  {
    id: 'gap-2',
    title: 'Privacy-preserving machine learning on decentralized networks',
    description: 'Techniques for training ML models without compromising data privacy in P2P networks',
    relevance: 0.88,
    topics: ['machine-learning', 'privacy', 'decentralized']
  },
  {
    id: 'gap-3',
    title: 'Scalable P2P databases with CRDTs',
    description: 'Building eventually-consistent distributed databases using Conflict-free Replicated Data Types',
    relevance: 0.85,
    topics: ['p2p', 'databases', 'crdts']
  },
  {
    id: 'gap-4',
    title: 'Zero-knowledge proofs for code verification',
    description: 'Using ZK-proofs to verify code execution without revealing the code itself',
    relevance: 0.90,
    topics: ['zero-knowledge', 'verification', 'privacy']
  },
  {
    id: 'gap-5',
    title: 'Decentralized identity in IoT ecosystems',
    description: 'Implementing self-sovereign identity solutions for IoT device networks',
    relevance: 0.78,
    topics: ['identity', 'iot', 'decentralized']
  }
];

export const techTrends = {
  'machine-learning': 0.9,
  'blockchain': 0.8,
  'quantum-computing': 0.95,
  'p2p': 0.7,
  'rust': 0.85,
  'go': 0.75,
  'microservices': 0.6,
  'decentralized': 0.8,
  'transformers': 0.9,
  'identity': 0.7,
  'zero-knowledge': 0.88,
  'solidity': 0.72,
  'privacy': 0.84,
  'webassembly': 0.76,
  'performance': 0.65,
  'benchmarks': 0.55,
  'databases': 0.68,
  'distributed-systems': 0.79,
  'crdts': 0.82,
  'code-generation': 0.87,
  'ipfs': 0.73,
  'file-sharing': 0.58,
  'algorithms': 0.71,
  'optimization': 0.69
};

export const mockUsers = {
  'techguru': {
    name: 'Tech Guru',
    reputation: 0.8,
    specialties: ['machine-learning', 'transformers', 'code-generation'],
    followers: 1243,
    posts: 87
  },
  'blockchaindev': {
    name: 'Blockchain Developer',
    reputation: 0.7,
    specialties: ['blockchain', 'identity', 'decentralized'],
    followers: 892,
    posts: 64
  },
  'quantumphys': {
    name: 'Quantum Physicist',
    reputation: 0.9,
    specialties: ['quantum-computing', 'algorithms', 'optimization'],
    followers: 2156,
    posts: 45
  },
  'p2penthusiast': {
    name: 'P2P Enthusiast',
    reputation: 0.6,
    specialties: ['p2p', 'ipfs', 'file-sharing'],
    followers: 678,
    posts: 103
  },
  'backendexpert': {
    name: 'Backend Expert',
    reputation: 0.75,
    specialties: ['rust', 'go', 'microservices'],
    followers: 1089,
    posts: 72
  },
  'cryptowizard': {
    name: 'Crypto Wizard',
    reputation: 0.85,
    specialties: ['blockchain', 'zero-knowledge', 'privacy'],
    followers: 1567,
    posts: 56
  },
  'perfengineer': {
    name: 'Performance Engineer',
    reputation: 0.65,
    specialties: ['performance', 'webassembly', 'benchmarks'],
    followers: 534,
    posts: 41
  },
  'dbarchitect': {
    name: 'Database Architect',
    reputation: 0.78,
    specialties: ['databases', 'distributed-systems', 'crdts'],
    followers: 923,
    posts: 59
  }
};

export const mockGraphNodes = [
  { id: 'node-1', label: 'Quantum Computing', type: 'technology', connections: ['node-2', 'node-4'] },
  { id: 'node-2', label: 'Blockchain', type: 'technology', connections: ['node-1', 'node-3', 'node-5'] },
  { id: 'node-3', label: 'Decentralized Identity', type: 'concept', connections: ['node-2', 'node-6'] },
  { id: 'node-4', label: 'Optimization Algorithms', type: 'concept', connections: ['node-1', 'node-7'] },
  { id: 'node-5', label: 'Zero-Knowledge Proofs', type: 'technology', connections: ['node-2', 'node-8'] },
  { id: 'node-6', label: 'IoT Systems', type: 'domain', connections: ['node-3'] },
  { id: 'node-7', label: 'Machine Learning', type: 'technology', connections: ['node-4', 'node-8'] },
  { id: 'node-8', label: 'Privacy-Preserving Tech', type: 'concept', connections: ['node-5', 'node-7'] }
];

export const mockPDSData = {
  nodeId: 'pds-node-001',
  status: 'active',
  peers: ['peer-123', 'peer-456', 'peer-789'],
  storage: {
    total: '100GB',
    used: '42GB',
    available: '58GB'
  },
  lastSync: '2025-10-15T10:30:00Z'
};