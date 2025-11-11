import React, { useState } from 'react';

export default function Simulator() {
  const [form, setForm] = useState({ to: '', value: '0.1', gasPrice: '50', gasLimit: '21000' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const runSim = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Use environment variable for API URL
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003';
      const res = await fetch(`${apiUrl}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: form.to,
          value: form.value,
          gasPrice: form.gasPrice,
          gasLimit: form.gasLimit,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Simulation failed');
      setResult(json.data);
    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-brand-neon/20 bg-slate-900/60 p-6">
      <h3 className="text-lg font-semibold text-brand-neon mb-4">Transaction Simulator</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input name="to" value={form.to} onChange={onChange} placeholder="To address" className="col-span-2 p-2 rounded bg-slate-800 text-sm text-slate-200" />
        <input name="value" value={form.value} onChange={onChange} placeholder="Value (ETH)" className="p-2 rounded bg-slate-800 text-sm text-slate-200" />
        <input name="gasPrice" value={form.gasPrice} onChange={onChange} placeholder="Gas Price (Gwei)" className="p-2 rounded bg-slate-800 text-sm text-slate-200" />
      </div>

      <div className="flex gap-2">
        <button onClick={runSim} disabled={loading} className="bg-brand-neon text-black px-4 py-2 rounded">
          {loading ? 'Simulating...' : 'Run Simulation'}
        </button>
      </div>

      {error && <div className="mt-4 text-red-400">Error: {error}</div>}

      {result && (
        <div className="mt-4 bg-slate-800 p-4 rounded text-sm text-slate-200">
          <div className="mb-2"><strong>Risk Score:</strong> {result.analysis.riskScore}%</div>
          <div className="mb-2"><strong>Slippage Loss (ETH):</strong> {result.analysis.slippageLoss.toFixed(6)}</div>
          <div className="mb-2"><strong>Estimated MEV profit:</strong> ${result.mevProfit}</div>
          <div className="mb-2"><strong>Flashbots simulation:</strong> MEV Savings ${result.protection.mevSavings}</div>
          <div className="mt-2 text-xs text-slate-400">Recommendations: {(result.protection.recommendations || []).join('; ')}</div>
        </div>
      )}
    </div>
  );
}