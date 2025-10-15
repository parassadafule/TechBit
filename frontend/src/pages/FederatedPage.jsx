import React, { useEffect, useState } from 'react';
import { federatedAPI } from '../services/api';

export default function FederatedPage() {
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState('');
  const [ack, setAck] = useState(null);
  useEffect(() => {
    (async () => {
      setStatus(await federatedAPI.status());
    })();
  }, []);
  async function report() {
    try {
      const m = metrics ? JSON.parse(metrics) : {};
      const r = await federatedAPI.report(m);
      setAck(r);
    } catch (e) {
      setAck({ error: String(e) });
    }
  }
  return (
    <div className="page federated-page">
      <h2>Federated Learning</h2>
      <pre>{JSON.stringify(status, null, 2)}</pre>
      <textarea placeholder='{"loss":0.1}' value={metrics} onChange={e => setMetrics(e.target.value)} />
      <button onClick={report}>Report Metrics</button>
      {ack && <pre>{JSON.stringify(ack, null, 2)}</pre>}
    </div>
  );
}


