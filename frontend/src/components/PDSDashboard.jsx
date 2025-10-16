import React, { useState, useEffect } from 'react';
import { pdsAPI } from '../services/api';

const PDSDashboard = () => {
  const [status, setStatus] = useState(null);
  const [peers, setPeers] = useState([]);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishContent, setPublishContent] = useState({ title: '', data: '' });
  const [syncHash, setSyncHash] = useState('');

  useEffect(() => {
    loadPDSData();
    // Set up periodic refresh
    const interval = setInterval(loadPDSData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPDSData = async () => {
    try {
      const [statusData, peersData, storageData] = await Promise.all([
        pdsAPI.getStatus(),
        pdsAPI.getPeers(),
        pdsAPI.getStorage(),
      ]);
      setStatus(statusData);
      setPeers(peersData.peers || []);
      setStorage(storageData);
    } catch (error) {
      console.error('Failed to load PDS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!publishContent.title || !publishContent.data) return;

    try {
      const result = await pdsAPI.publish(publishContent);
      alert(`Content published successfully!\nHash: ${result.contentHash}`);
      setPublishContent({ title: '', data: '' });
    } catch (error) {
      alert('Failed to publish content');
      console.error('Publish error:', error);
    }
  };

  const handleSync = async () => {
    if (!syncHash.trim()) return;

    try {
      await pdsAPI.sync(syncHash);
      alert('Data synchronized successfully!');
      setSyncHash('');
    } catch (error) {
      alert('Failed to sync data');
      console.error('Sync error:', error);
    }
  };

  const formatUptime = (uptime) => {
    // Parse uptime string like "1h 30m 15s"
    return uptime;
  };

  const formatBytes = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="pds-container">
        <div className="loading">Loading PDS data...</div>
      </div>
    );
  }

  return (
    <div className="pds-container">
      <div className="pds-header">
        <h2>P2P Data Server (PDS)</h2>
        <button onClick={loadPDSData} className="refresh-btn">🔄 Refresh</button>
      </div>

      <div className="pds-grid">
        {/* Status Card */}
        <div className="pds-card status-card">
          <h3>Server Status</h3>
          {status && (
            <div className="status-info">
              <div className="status-item">
                <span className="label">Node ID:</span>
                <span className="value">{status.nodeId}</span>
              </div>
              <div className="status-item">
                <span className="label">Status:</span>
                <span className={`value status-${status.status.toLowerCase()}`}>
                  {status.status}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Uptime:</span>
                <span className="value">{formatUptime(status.uptime)}</span>
              </div>
              <div className="status-item">
                <span className="label">Last Sync:</span>
                <span className="value">
                  {new Date(status.lastSync).toLocaleString()}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Start Time:</span>
                <span className="value">
                  {new Date(status.startTime).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Peers Card */}
        <div className="pds-card peers-card">
          <h3>Connected Peers ({peers.length})</h3>
          <div className="peers-list">
            {peers.length > 0 ? (
              peers.map((peer, index) => (
                <div key={index} className="peer-item">
                  <span className="peer-id">{peer}</span>
                  <span className="peer-status">🟢 Connected</span>
                </div>
              ))
            ) : (
              <p className="no-peers">No peers connected</p>
            )}
          </div>
        </div>

        {/* Storage Card */}
        <div className="pds-card storage-card">
          <h3>Storage Information</h3>
          {storage && (
            <div className="storage-info">
              <div className="storage-bar">
                <div
                  className="storage-used"
                  style={{ width: `${storage.usagePercent}%` }}
                ></div>
              </div>
              <div className="storage-details">
                <div className="storage-item">
                  <span className="label">Total:</span>
                  <span className="value">{formatBytes(storage.total)}</span>
                </div>
                <div className="storage-item">
                  <span className="label">Used:</span>
                  <span className="value">{formatBytes(storage.used)}</span>
                </div>
                <div className="storage-item">
                  <span className="label">Available:</span>
                  <span className="value">{formatBytes(storage.available)}</span>
                </div>
                <div className="storage-item">
                  <span className="label">Usage:</span>
                  <span className="value">{storage.usagePercent}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Publish Content Card */}
        <div className="pds-card publish-card">
          <h3>Publish Content</h3>
          <div className="publish-form">
            <input
              type="text"
              placeholder="Content Title"
              value={publishContent.title}
              onChange={(e) => setPublishContent(prev => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              placeholder="Content Data"
              value={publishContent.data}
              onChange={(e) => setPublishContent(prev => ({ ...prev, data: e.target.value }))}
              rows={4}
            />
            <button onClick={handlePublish} disabled={!publishContent.title || !publishContent.data}>
              Publish to Network
            </button>
          </div>
        </div>

        {/* Sync Data Card */}
        <div className="pds-card sync-card">
          <h3>Sync Data</h3>
          <div className="sync-form">
            <input
              type="text"
              placeholder="Data Hash (e.g., QmXxx...)"
              value={syncHash}
              onChange={(e) => setSyncHash(e.target.value)}
            />
            <button onClick={handleSync} disabled={!syncHash.trim()}>
              Sync Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDSDashboard;