import React, { useEffect, useState } from 'react';

export default function WeeklyReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        // Use environment variable for API URL
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003';
        const res = await fetch(`${apiUrl}/api/reports/weekly`);
        const json = await res.json();
        if (json.success) setReport(json.data);
      } catch (e) {
        console.warn('Failed to load weekly report', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <div className="p-3 text-sm text-slate-300">Loading weekly report...</div>;
  if (!report) return <div className="p-3 text-sm text-slate-400">No report available</div>;

  return (
    <div className="rounded-lg border border-brand-neon/20 bg-slate-900/60 p-4">
      <h4 className="text-md font-semibold text-brand-neon mb-2">Weekly Trend Report</h4>
      <div className="text-sm text-slate-200">
        <div className="mb-2">Generated at: {new Date(report.generatedAt).toLocaleString()}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {report.days.map((d) => (
            <div key={d.day} className="p-2 bg-slate-800/40 rounded">
              <div className="text-xs text-slate-400">{d.day}</div>
              <div className="font-bold text-brand-neon">{d.attacks} attacks</div>
              <div className="text-xs text-slate-400">Avg Risk: {d.avgRisk}%</div>
              <div className="text-xs text-slate-400">Slippage: ${d.totalSlippage}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}