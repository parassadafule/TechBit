// import { graphql, buildSchema } from 'graphql';
import { mockKnowledgeGaps, mockGraphNodes } from '../mockData.js';
import { getGraphData, findRelatedNodes } from './builder.js';

// const schema = buildSchema(`
//   type Query {
//     knowledgeGap(topic: String!): [String]
//   }
// `);

// export const root = {
//   knowledgeGap: (args) => {
//     // Query graph for gaps
//     return ['gap1', 'gap2']; // Placeholder
//   }
// };

export function queryGraph(query) {
  if (!query || typeof query !== 'string') {
    return { error: 'Invalid query. Please provide a valid search string.' };
  }
  
  const lowerQuery = query.toLowerCase();
  
  // Search for knowledge gaps
  if (lowerQuery.includes('gap') || lowerQuery.includes('knowledge')) {
    const filteredGaps = mockKnowledgeGaps.filter(gap => 
      gap.title.toLowerCase().includes(lowerQuery) ||
      gap.description.toLowerCase().includes(lowerQuery) ||
      gap.topics.some(topic => lowerQuery.includes(topic))
    );
    
    return { 
      type: 'knowledge-gaps',
      data: filteredGaps.length > 0 ? filteredGaps : mockKnowledgeGaps,
      count: filteredGaps.length > 0 ? filteredGaps.length : mockKnowledgeGaps.length
    };
  }
  
  // Search for nodes by label or type
  const matchingNodes = mockGraphNodes.filter(node =>
    node.label.toLowerCase().includes(lowerQuery) ||
    node.type.toLowerCase().includes(lowerQuery)
  );
  
  if (matchingNodes.length > 0) {
    return {
      type: 'graph-nodes',
      data: matchingNodes,
      count: matchingNodes.length
    };
  }
  
  // Default: return all data if no specific match
  return { 
    type: 'no-match',
    message: 'No specific results found. Showing all available data.',
    knowledgeGaps: mockKnowledgeGaps,
    graphNodes: mockGraphNodes
  };
}

// Minimal GraphQL-like stub: accepts a simple object { type: 'nodes'|'gaps', filter: string }
export function graphQLStub(q) {
  if (!q || typeof q !== 'object') {
    return { error: 'Invalid query object' };
  }
  if (q.type === 'gaps') {
    if (!q.filter) return { gaps: mockKnowledgeGaps };
    const f = String(q.filter).toLowerCase();
    return { gaps: mockKnowledgeGaps.filter(g => g.title.toLowerCase().includes(f) || g.description.toLowerCase().includes(f)) };
  }
  if (q.type === 'nodes') {
    if (!q.filter) return { nodes: mockGraphNodes };
    const f = String(q.filter).toLowerCase();
    return { nodes: mockGraphNodes.filter(n => n.label.toLowerCase().includes(f) || n.type.toLowerCase().includes(f)) };
  }
  return { error: 'Unsupported type' };
}

export function queryKnowledgeGaps(filters = {}) {
  let gaps = [...mockKnowledgeGaps];
  
  // Filter by minimum relevance
  if (filters.minRelevance) {
    gaps = gaps.filter(gap => gap.relevance >= filters.minRelevance);
  }
  
  // Filter by topics
  if (filters.topics && filters.topics.length > 0) {
    gaps = gaps.filter(gap => 
      gap.topics.some(topic => filters.topics.includes(topic))
    );
  }
  
  // Sort by relevance
  gaps.sort((a, b) => b.relevance - a.relevance);
  
  // Limit results
  if (filters.limit) {
    gaps = gaps.slice(0, filters.limit);
  }
  
  return {
    gaps,
    count: gaps.length,
    filters: filters
  };
}

export function queryNodeConnections(nodeId, depth = 1) {
  try {
    const node = mockGraphNodes.find(n => n.id === nodeId);
    if (!node) {
      return { error: `Node with id ${nodeId} not found` };
    }
    
    const relatedNodes = findRelatedNodes(nodeId, depth);
    
    return {
      node,
      relatedNodes,
      connectionCount: relatedNodes.length,
      depth
    };
  } catch (error) {
    return { error: error.message };
  }
}

export function findPathBetweenNodes(startNodeId, endNodeId) {
  const visited = new Set();
  const queue = [[startNodeId]];
  
  while (queue.length > 0) {
    const path = queue.shift();
    const currentNodeId = path[path.length - 1];
    
    if (currentNodeId === endNodeId) {
      const nodes = path.map(id => mockGraphNodes.find(n => n.id === id));
      return {
        found: true,
        path: nodes,
        length: path.length - 1
      };
    }
    
    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);
    
    const currentNode = mockGraphNodes.find(n => n.id === currentNodeId);
    if (currentNode && currentNode.connections) {
      currentNode.connections.forEach(connId => {
        if (!visited.has(connId)) {
          queue.push([...path, connId]);
        }
      });
    }
  }
  
  return { found: false, message: 'No path found between nodes' };
}