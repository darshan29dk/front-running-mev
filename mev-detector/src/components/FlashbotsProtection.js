import React, { useState } from 'react';

const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function FlashbotsProtection() {
  const [txHex, setTxHex] = useState('');
  const [simulateOnly, setSimulateOnly] = useState(true);
  const [fastMode, setFastMode] = useState(true);
  const [hideResponse, setHideResponse] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    if (!hideResponse) {
      setResult(null);
    }
    try {
      const res = await fetch(`${apiBase}/protect-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHex, simulateOnly, fast: fastMode }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Protection failed');
      if (!hideResponse) {
        setResult(json.data);
      }
    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-brand-neon/20 bg-slate-900/60 p-4">
      <h4 className="text-md font-semibold text-brand-neon mb-3">Flashbots Protect</h4>
      <p className="text-xs text-slate-400 mb-3">Submit a raw transaction (hex) for private relay. Use simulation mode first.</p>
      <textarea value={txHex} onChange={(e) => setTxHex(e.target.value)} placeholder="0x... raw tx hex" className="w-full bg-slate-800 p-2 rounded text-sm text-slate-200 mb-3" rows={4} />
      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={simulateOnly} onChange={() => setSimulateOnly(s => !s)} />
          <span className="text-slate-300">Simulate only</span>
        </label>
        <label className={`flex items-center gap-2 text-sm ${simulateOnly ? 'opacity-40 cursor-not-allowed' : ''}`}>
          <input type="checkbox" checked={fastMode} onChange={() => setFastMode(s => !s)} disabled={simulateOnly} />
          <span className="text-slate-300">Fast mode</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hideResponse} onChange={() => setHideResponse(s => !s)} />
          <span className="text-slate-300">Hide response payload</span>
        </label>
        <button onClick={submit} disabled={loading || !txHex} className="bg-brand-neon text-black px-3 py-2 rounded text-sm font-medium">
          {loading ? 'Submitting...' : (simulateOnly ? 'Simulate' : 'Submit')}
        </button>
      </div>

      {error && <div className="text-red-400 text-sm">Error: {error}</div>}
      {!hideResponse && result && (
        <div className="mt-3 bg-slate-800 p-3 rounded text-sm text-slate-200">
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
