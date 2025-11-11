import React, { useState, useEffect } from 'react';

const RiskHeatmap = ({ data = [] }) => {
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    // Generate heatmap data for hourly risk patterns (last 24 hours)
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = (24 - i - 1).toString().padStart(2, '0');
      const risk = Math.floor(Math.random() * 100);
      const attacks = Math.floor(Math.random() * 15);
      return { hour: `${hour}:00`, risk, attacks };
    });
    setHeatmapData(hours);
  }, [data]);

  const getRiskColor = (risk) => {
    if (risk < 20) return 'bg-green-900/40 hover:bg-green-800/60';
    if (risk < 40) return 'bg-yellow-900/40 hover:bg-yellow-800/60';
    if (risk < 60) return 'bg-orange-900/40 hover:bg-orange-800/60';
    return 'bg-red-900/40 hover:bg-red-800/60';
  };

  const getRiskBorderColor = (risk) => {
    if (risk < 20) return 'border-green-500/50';
    if (risk < 40) return 'border-yellow-500/50';
    if (risk < 60) return 'border-orange-500/50';
    return 'border-red-500/50';
  };

  const getRiskTextColor = (risk) => {
    if (risk < 20) return 'text-green-300';
    if (risk < 40) return 'text-yellow-300';
    if (risk < 60) return 'text-orange-300';
    return 'text-red-300';
  };

  const avgRisk = Math.round(
    heatmapData.reduce((sum, item) => sum + item.risk, 0) / heatmapData.length || 0
  );

  const maxRisk = Math.max(...heatmapData.map(h => h.risk), 0);
  const peakHour = heatmapData.find(h => h.risk === maxRisk);

  return (
    <div className="rounded-2xl border border-brand-neon/30 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-6 backdrop-blur">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-brand-neon mb-1">🔥 Risk Heatmap (24h)</h3>
            <p className="text-slate-400 text-sm">MEV activity intensity by hour</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Average Risk</div>
            <div className={`text-2xl font-bold ${
              avgRisk < 20 ? 'text-green-400' :
              avgRisk < 40 ? 'text-yellow-400' :
              avgRisk < 60 ? 'text-orange-400' :
              'text-red-400'
            }`}>
              {avgRisk}%
            </div>
          </div>
        </div>

        {peakHour && (
          <div className="bg-slate-800/50 border border-brand-neon/30 rounded-lg p-3">
            <p className="text-sm text-slate-300">
              <span className="font-bold text-brand-neon">Peak Activity:</span> {peakHour.hour} ({peakHour.attacks} attacks)
            </p>
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-6 gap-2">
          {heatmapData.map((item, idx) => (
            <div
              key={idx}
              className={`relative group cursor-pointer transition ${getRiskColor(item.risk)} ${getRiskBorderColor(item.risk)} border rounded-lg p-2 text-center`}
            >
              <div className={`text-xs font-mono font-bold ${getRiskTextColor(item.risk)}`}>
                {item.risk}%
              </div>
              <div className="text-xs text-slate-400 mt-1">{item.hour}</div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-950 border border-brand-neon/50 rounded-lg text-xs text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                <div className="font-bold text-brand-neon">{item.hour}</div>
                <div>Risk: {item.risk}%</div>
                <div>Attacks: {item.attacks}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <p className="text-xs font-medium text-slate-400 mb-2">Risk Levels:</p>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-900/60 border border-green-500/50"></div>
            <span className="text-slate-400">Low (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-900/60 border border-yellow-500/50"></div>
            <span className="text-slate-400">Medium (20-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-900/60 border border-orange-500/50"></div>
            <span className="text-slate-400">High (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-900/60 border border-red-500/50"></div>
            <span className="text-slate-400">Critical (&gt;60%)</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400">Total Attacks</div>
          <div className="text-xl font-bold text-brand-neon">{heatmapData.reduce((sum, h) => sum + h.attacks, 0)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400">Peak Risk</div>
          <div className="text-xl font-bold text-red-400">{maxRisk}%</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400">Safe Hours</div>
          <div className="text-xl font-bold text-green-400">{heatmapData.filter(h => h.risk < 30).length}</div>
        </div>
      </div>
    </div>
  );
};

export default RiskHeatmap;