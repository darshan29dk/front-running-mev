import React, { useState, useEffect } from 'react';

const Rewards = ({ userAddress = 'Connected Wallet' }) => {
  const [points, setPoints] = useState(1250);
  const [level, setLevel] = useState(3);
  const [badges, setBadges] = useState([
    { id: 1, name: 'First Strike', icon: '⚡', desc: 'Detect your first MEV attack', earned: true },
    { id: 2, name: 'Guardian', icon: '🛡️', desc: 'Successfully protect 5 transactions', earned: true },
    { id: 3, name: 'Analyst', icon: '📊', desc: 'Run 10 transaction simulations', earned: true },
    { id: 4, name: 'Researcher', icon: '🔬', desc: 'Submit attack report (coming)', earned: false },
    { id: 5, name: 'Legend', icon: '👑', desc: 'Reach 5000 protection points', earned: false },
    { id: 6, name: 'Speedrunner', icon: '🏃', desc: 'Protected transaction in <15s', earned: false }
  ]);

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, address: '0x5678...', points: 3200, badges: 5 },
    { rank: 2, address: '0x1234...', points: 2800, badges: 4 },
    { rank: 3, address: userAddress, points: points, badges: badges.filter(b => b.earned).length },
    { rank: 4, address: '0xabcd...', points: 1100, badges: 2 },
    { rank: 5, address: '0xef01...', points: 950, badges: 1 }
  ]);

  const progressToNextLevel = (points % 1000) / 10;

  return (
    <div className="rounded-2xl border border-brand-neon/30 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-6 backdrop-blur space-y-6">
      
      {/* Profile Section */}
      <div className="bg-gradient-to-r from-green-600/20 to-brand-neon/20 border border-brand-neon/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-brand-neon">Your Profile</h3>
            <p className="text-slate-400 text-sm font-mono">{userAddress}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-yellow-400">{level}</div>
            <div className="text-xs text-slate-400">Level</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-300">Next Level</span>
            <span className="text-slate-400 font-mono">{points} / {Math.round((level + 1) * 1000)}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-green-500 to-brand-neon h-full transition-all duration-500"
              style={{ width: `${progressToNextLevel}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{points}</div>
            <div className="text-xs text-slate-400">Points</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-brand-neon">{badges.filter(b => b.earned).length}</div>
            <div className="text-xs text-slate-400">Badges</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">3</div>
            <div className="text-xs text-slate-400">Streak</div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div>
        <h4 className="text-lg font-bold text-brand-neon mb-3">🏆 Badges</h4>
        <div className="grid grid-cols-3 gap-3">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={`rounded-lg p-3 text-center transition ${
                badge.earned
                  ? 'bg-gradient-to-br from-yellow-500/20 to-brand-neon/20 border border-yellow-500/50'
                  : 'bg-slate-800/50 border border-slate-700/50 opacity-60'
              }`}
            >
              <div className="text-3xl mb-1">{badge.icon}</div>
              <p className="text-xs font-bold text-slate-200">{badge.name}</p>
              <p className="text-xs text-slate-400 line-clamp-2">{badge.desc}</p>
              {badge.earned && <div className="text-brand-neon text-xs font-bold mt-1">✓ Earned</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <h4 className="text-sm font-bold text-slate-300 mb-3">💰 How to Earn Points</h4>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex justify-between">
            <span>✓ Detect MEV attack</span>
            <span className="text-brand-neon">+10 pts</span>
          </li>
          <li className="flex justify-between">
            <span>✓ Protect transaction</span>
            <span className="text-brand-neon">+25 pts</span>
          </li>
          <li className="flex justify-between">
            <span>✓ Run simulation</span>
            <span className="text-brand-neon">+5 pts</span>
          </li>
          <li className="flex justify-between">
            <span>✓ Daily login streak</span>
            <span className="text-brand-neon">+50 pts</span>
          </li>
        </ul>
      </div>

      {/* Leaderboard */}
      <div>
        <h4 className="text-lg font-bold text-brand-neon mb-3">🏅 Leaderboard (Top 5)</h4>
        <div className="space-y-2">
          {leaderboard.map(entry => (
            <div
              key={entry.rank}
              className={`flex items-center justify-between p-3 rounded-lg transition ${
                entry.address === userAddress
                  ? 'bg-brand-neon/20 border border-brand-neon/50'
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`font-bold text-lg w-6 ${
                  entry.rank === 1 ? 'text-yellow-400' :
                  entry.rank === 2 ? 'text-gray-400' :
                  entry.rank === 3 ? 'text-orange-400' :
                  'text-slate-400'
                }`}>
                  #{entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 font-mono text-sm truncate">{entry.address}</p>
                  <p className="text-xs text-slate-500">
                    {entry.badges} badge{entry.badges !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-brand-neon">{entry.points}</div>
                <div className="text-xs text-slate-500">pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Shop (Coming Soon) */}
      <div className="bg-slate-800/30 border border-dashed border-slate-600 rounded-xl p-4 text-center">
        <div className="text-2xl mb-2">🎁</div>
        <p className="text-slate-300 font-medium">Rewards Shop Coming Soon</p>
        <p className="text-sm text-slate-400">Redeem points for premium features, NFT badges & more!</p>
      </div>
    </div>
  );
};

export default Rewards;