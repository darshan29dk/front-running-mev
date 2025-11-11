import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

const EmailAlerts = () => {
  const [email, setEmail] = useState('');
  const [alerts, setAlerts] = useState({
    sandwich: true,
    frontrun: true,
    backrun: true,
    highGas: true,
    highSlippage: true
  });
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showTestEmail, setShowTestEmail] = useState(false);
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const emailServiceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || '';
  const subscriptionTemplateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID_SUBSCRIPTION || '';
  const alertTemplateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID_ALERT || '';

  useEffect(() => {
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '';
    if (!publicKey) {
      return;
    }
    try {
      emailjs.init(publicKey);
    } catch (err) {
      console.log('EmailJS init failed', err);
    }
  }, []);

  const getAlertSummary = () => {
    const selected = Object.entries(alerts)
      .filter(([_, val]) => val)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());
    return selected.length ? selected.join(', ') : 'No alerts selected';
  };

  const sendEmailViaEmailJS = async (templateId, params) => {
    if (!emailServiceId || !templateId) {
      return false;
    }
    try {
      await emailjs.send(emailServiceId, templateId, params);
      return true;
    } catch (err) {
      console.log('EmailJS send failed', err);
      return false;
    }
  };

  const handleAlertToggle = (key) => {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage('❌ Please enter a valid email');
      return;
    }

    setLoading(true);

    const alertSummary = getAlertSummary();
    const templateParams = {
      to_email: email,
      subscriber_email: email,
      alert_types: alertSummary,
      message: `You've successfully subscribed to MEV Detector alerts! You'll receive notifications for: ${alertSummary}`
    };

    try {
      const response = await fetch(`${apiBase}/alerts/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, alerts })
      });
      const data = await response.json().catch(() => null);

      if (response.ok) {
        setSubscribed(true);
        setMessage(`✅ ${data?.message || `Subscribed! You'll receive alerts at ${email}`}`);
        setTimeout(() => setMessage(''), 5000);
        return;
      }

      const fallbackSent = await sendEmailViaEmailJS(subscriptionTemplateId, templateParams);
      if (fallbackSent) {
        setSubscribed(true);
        setMessage('✅ Subscription confirmed via EmailJS fallback');
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ ${data?.error || 'Subscription failed. Try again later.'}`);
      }
    } catch (err) {
      const fallbackSent = await sendEmailViaEmailJS(subscriptionTemplateId, templateParams);
      if (fallbackSent) {
        setSubscribed(true);
        setMessage('✅ Subscription confirmed via EmailJS fallback');
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('❌ Subscription failed. Try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!email || !subscribed) {
      setMessage('❌ Please subscribe first');
      return;
    }

    setLoading(true);

    const templateParams = {
      to_email: email,
      attack_type: 'Sandwich Attack (Test)',
      risk_score: '87 (HIGH)',
      slippage_loss: '$125.50',
      message: 'This is a test MEV alert from MEV Detector Dashboard'
    };

    try {
      const response = await fetch(`${apiBase}/alerts/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          testAttack: {
            type: 'sandwich',
            riskScore: 87,
            slippageLoss: 125.50,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setMessage('✅ Test email sent! Check your inbox.');
        setTimeout(() => setMessage(''), 4000);
        return;
      }

      const fallbackSent = await sendEmailViaEmailJS(alertTemplateId, templateParams);
      if (fallbackSent) {
        setMessage('✅ Test email sent via EmailJS!');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage('ℹ️ Test email in development mode (backend offline)');
      }
    } catch (err) {
      const fallbackSent = await sendEmailViaEmailJS(alertTemplateId, templateParams);
      if (fallbackSent) {
        setMessage('✅ Test email sent via EmailJS!');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage('ℹ️ Feature available when backend is running');
      }
    } finally {
      setLoading(false);
      setShowTestEmail(false);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-neon/30 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-6 backdrop-blur">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-brand-neon mb-2">📧 Email Alerts</h3>
        <p className="text-slate-400 text-sm">Get notified of MEV attacks in real-time</p>
      </div>

      {subscribed ? (
        <div className="space-y-4">
          <div className="bg-brand-neon/10 border border-brand-neon/30 rounded-lg p-4">
            <p className="text-brand-neon font-medium">✓ You're subscribed to alerts!</p>
          </div>

          <div className="space-y-3">
            <p className="text-slate-300 font-medium">Alert Preferences:</p>
            {Object.entries(alerts).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleAlertToggle(key)}
                  className="w-4 h-4 rounded border-brand-neon"
                />
                <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSubscribed(false)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition"
            >
              Edit Preferences
            </button>
            <button
              onClick={handleSendTestEmail}
              disabled={loading}
              className="bg-brand-neon text-black px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-brand-neon focus:outline-none transition"
              required
            />
          </div>

          <div>
            <p className="text-slate-300 text-sm mb-2">Alert Types</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(alerts).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleAlertToggle(key)}
                    className="w-4 h-4 rounded border-brand-neon"
                  />
                  <span className="text-slate-300 capitalize text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-neon text-black py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Subscribing...' : 'Subscribe to Alerts'}
          </button>
        </form>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.includes('✅') ? 'bg-green-500/10 text-green-300 border border-green-500/30' :
          message.includes('❌') ? 'bg-red-500/10 text-red-300 border border-red-500/30' :
          'bg-slate-700/50 text-slate-300 border border-slate-600/50'
        }`}>
          {message}
        </div>
      )}

      {showTestEmail && (
        <div className="mt-4 p-4 bg-slate-800/50 border border-brand-neon/30 rounded-lg">
          <p className="text-brand-neon font-medium mb-2">Test Email Preview</p>
          <div className="text-sm text-slate-300 space-y-1">
            <p><strong>To:</strong> {email}</p>
            <p><strong>Subject:</strong> MEV Alert: Sandwich Attack Detected</p>
            <p><strong>Body:</strong> High-risk MEV attack detected on your transaction. Risk Score: 87%. Potential slippage loss: $125.50. Consider using Flashbots protection.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAlerts;