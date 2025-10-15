// import { createLibp2p } from 'libp2p';
// import { create } from 'ipfs-http-client';
import { mockPDSData } from '../mockData.js';

let pdsInstance = null;

export async function startPDS() {
  // const libp2p = await createLibp2p({
  //   // Config for P2P networking
  // });
  
  // const ipfs = create();
  
  // Handle data syncing via IPFS/libp2p
  
  pdsInstance = {
    ...mockPDSData,
    startTime: new Date().toISOString(),
    status: 'running'
  };
  
  console.log('PDS (Personal Data Server) started successfully');
  console.log(`Node ID: ${pdsInstance.nodeId}`);
  console.log(`Connected peers: ${pdsInstance.peers.length}`);
  
  return pdsInstance;
}

export function getPDSStatus() {
  if (!pdsInstance) {
    return {
      status: 'not-started',
      message: 'PDS has not been initialized. Call startPDS() first.'
    };
  }
  
  return {
    ...pdsInstance,
    uptime: calculateUptime(pdsInstance.startTime)
  };
}

export function getPeerList() {
  if (!pdsInstance) {
    throw new Error('PDS not started');
  }
  
  return {
    peers: pdsInstance.peers,
    count: pdsInstance.peers.length,
    nodeId: pdsInstance.nodeId
  };
}

export function getStorageInfo() {
  if (!pdsInstance) {
    throw new Error('PDS not started');
  }
  
  const { total, used, available } = pdsInstance.storage;
  const usedPercent = ((parseFloat(used) / parseFloat(total)) * 100).toFixed(1);
  
  return {
    storage: pdsInstance.storage,
    usagePercent: usedPercent,
    status: usedPercent > 80 ? 'warning' : 'ok'
  };
}

export async function syncData(dataHash) {
  if (!pdsInstance) {
    throw new Error('PDS not started');
  }
  
  // Simulate data sync operation
  return new Promise((resolve) => {
    setTimeout(() => {
      pdsInstance.lastSync = new Date().toISOString();
      resolve({
        success: true,
        dataHash,
        syncTime: pdsInstance.lastSync,
        peers: pdsInstance.peers
      });
    }, 200);
  });
}

export async function publishContent(content) {
  if (!pdsInstance) {
    throw new Error('PDS not started');
  }
  
  // Simulate content publishing to IPFS
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
      resolve({
        success: true,
        contentHash: mockHash,
        size: JSON.stringify(content).length,
        timestamp: new Date().toISOString(),
        replicatedTo: pdsInstance.peers.slice(0, 2)
      });
    }, 150);
  });
}

function calculateUptime(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const uptimeMs = now - start;
  
  const seconds = Math.floor(uptimeMs / 1000) % 60;
  const minutes = Math.floor(uptimeMs / (1000 * 60)) % 60;
  const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
  
  return `${hours}h ${minutes}m ${seconds}s`;
}