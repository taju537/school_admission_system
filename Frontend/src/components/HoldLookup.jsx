import React, { useState } from 'react';
import { admissionClient } from '../services/admissionClient';
import { SearchIcon, ClockIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from './Icons';
import { useNotification } from '../context/NotificationContext';
import { useCountdown } from '../hooks/useCountdown';

function LookupResultCard({ result }) {
  const { formatted, isExpired } = useCountdown(result.expiresAt);
  const displayStatus = result.status === 'HELD' && isExpired ? 'EXPIRED' : result.status;

  return (
    <div className="lookup-result-card">
      <div className="lookup-header">
        <div>
          <span className="tag-label">হোল্ড আইডি:</span>
          <span className="tag-val">{result.holdId}</span>
        </div>
        <span className={`status-badge status-badge-${displayStatus.toLowerCase()}`}>
          {displayStatus === 'HELD' && <ClockIcon size={14} />}
          {displayStatus === 'CONFIRMED' && <CheckCircleIcon size={14} />}
          {displayStatus === 'EXPIRED' && <AlertCircleIcon size={14} />}
          {displayStatus === 'CANCELLED' && <XCircleIcon size={14} />}
          <span>{displayStatus}</span>
        </span>
      </div>

      <div className="lookup-grid">
        <div>
          <span className="grid-label">ক্লাস আইডি:</span>
          <span className="grid-val">{result.classId}</span>
        </div>
        <div>
          <span className="grid-label">মেয়াদ শেষ হওয়ার সময়:</span>
          <span className="grid-val">
            {result.expiresAt ? new Date(result.expiresAt).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </div>

      {displayStatus === 'HELD' && (
        <div className="lookup-timer">
          <ClockIcon size={16} />
          <span>বাকি সময়: <strong>{formatted}</strong></span>
        </div>
      )}
    </div>
  );
}

export function HoldLookup() {
  const [lookupId, setLookupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { error, info } = useNotification();

  const handleSearch = async (e) => {
    e.preventDefault();
    const clean = lookupId.trim();
    if (!clean) {
      info('অনুগ্রহ করে একটি হোল্ড আইডি (যেমন h_123) লিখুন।');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await admissionClient.getHold(clean);
      setResult(data);
    } catch (err) {
      error(err.message || 'এই আইডি দিয়ে কোনো আবেদন পাওয়া যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-card lookup-card">
      <h3 className="card-subheading">
        <SearchIcon size={18} /> নির্দিষ্ট আবেদন অনুসন্ধান (Direct Hold Lookup)
      </h3>
      <p className="card-subdesc">
       যেকোনো হোল্ড আইডি দিয়ে সরাসরি বর্তমান অবস্থা যাচাই করুন।
      </p>

      <form onSubmit={handleSearch} className="lookup-form">
        <input
          type="text"
          className="text-input"
          placeholder="যেমন: h_789"
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary" disabled={loading || !lookupId.trim()}>
          {loading ? 'অনুসন্ধান হচ্ছে...' : 'যাচাই করুন'}
        </button>
      </form>

      {result && <LookupResultCard result={result} />}
    </div>
  );
}

