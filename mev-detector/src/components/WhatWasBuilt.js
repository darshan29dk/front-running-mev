import React, { useEffect, useState } from 'react';

export default function WhatWasBuilt() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchText = async () => {
      try {
        setLoading(true);
        // Use environment variable for API URL
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003';
        const res = await fetch(`${apiUrl}/api/what-was-built`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const t = await res.text();
        setText(t);
        setError(null);
      } catch (e) {
        setError(e.message || 'Failed to load');
        setText('');
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, []);

  if (loading) return <div className="p-4 text-sm text-slate-300">Loading project summary...</div>;
  if (error) return <div className="p-4 text-sm text-red-400">Error: {error}</div>;

  return (
    <div className="mt-8 rounded-lg border border-brand-neon/20 bg-white/3 p-6">
      <h3 className="text-lg font-semibold text-brand-neon mb-3">Project Summary</h3>
      <pre className="whitespace-pre-wrap text-sm text-slate-200" style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </pre>
    </div>
  );
}