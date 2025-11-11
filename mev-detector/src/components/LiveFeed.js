import React, { useEffect, useState, useRef } from 'react';

export default function LiveFeed() {
  const [events, setEvents] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Use environment variable for WebSocket URL
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3003';
    const url = `${wsUrl}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('LiveFeed: WebSocket connected');
      // Subscribe if needed
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'attacks' }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'attack-detected') {
          setEvents((s) => [msg.data, ...s].slice(0, 20));
        }
      } catch (e) {
        console.warn('LiveFeed: error parsing message', e);
      }
    };

    ws.onerror = (err) => console.error('LiveFeed WS error', err);
    ws.onclose = () => console.log('LiveFeed: WebSocket closed');

    return () => {
      try {
        ws.close();
      } catch (e) {}
    };
  }, []);

  if (!events.length) {
    return <div className="p-4 text-sm text-slate-400">No live attacks yet.</div>;
  }

  return (
    <div className="space-y-3">
      {events.map((e, i) => (
        <div key={e.id || i} className="rounded-md border border-brand-neon/20 bg-slate-900/60 p-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-slate-400">{e.attackType?.toUpperCase() || 'MEV'}</div>
              <div className="font-mono text-sm text-brand-neon">{(e.hash || '').slice(0, 18)}...</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-brand-neon">{e.riskScore}%</div>
              <div className="text-xs text-slate-500">{new Date(e.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Slippage: <span className="font-semibold text-brand-neon">${parseFloat(e.slippageLoss || 0).toFixed(4)}</span>
            {' • '}
            From: <span className="font-mono text-brand-neon">{(e.from || '').slice(0, 10)}...</span>
          </div>
        </div>
      ))}
    </div>
  );
}