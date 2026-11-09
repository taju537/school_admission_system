import React, { useState } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { ClockIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, CreditCardIcon, TrashIcon } from './Icons';

export function HoldCard({ hold, onConfirm, onCancel, confirming, cancelling }) {
  const [localStatus, setLocalStatus] = useState(hold.status);

  // If initial prop status changes (e.g. from server refresh), sync it
  React.useEffect(() => {
    setLocalStatus(hold.status);
  }, [hold.status]);

  // Real-time countdown timer hook
  const { formatted, isExpired, totalSeconds } = useCountdown(
    hold.expiresAt,
    () => {
      // Auto transition to EXPIRED when timer runs out without page reload (§1.5)
      if (localStatus === 'HELD') {
        setLocalStatus('EXPIRED');
      }
    }
  );

  const displayStatus = localStatus === 'HELD' && isExpired ? 'EXPIRED' : localStatus;
  const isHeldActive = displayStatus === 'HELD' && !isExpired;

  // Percentage for countdown progress bar (out of 600 seconds)
  const maxHoldSeconds = 600;
  const progressPercent = Math.min(100, Math.max(0, (totalSeconds / maxHoldSeconds) * 100));

  return (
    <div className={`hold-card hold-card-${displayStatus.toLowerCase()}`}>
      <div className="hold-card-top">
        <div className="hold-card-header">
          <span className="hold-id-tag">হোল্ড আইডি: <strong>{hold.holdId}</strong></span>
          <span className={`status-badge status-badge-${displayStatus.toLowerCase()}`}>
            {displayStatus === 'HELD' && <ClockIcon size={14} className="spin-slow" />}
            {displayStatus === 'CONFIRMED' && <CheckCircleIcon size={14} />}
            {displayStatus === 'EXPIRED' && <AlertCircleIcon size={14} />}
            {displayStatus === 'CANCELLED' && <XCircleIcon size={14} />}
            <span>
              {displayStatus === 'HELD' && 'সাময়িক সংরক্ষিত (HELD)'}
              {displayStatus === 'CONFIRMED' && 'ভর্তি নিশ্চিত (CONFIRMED)'}
              {displayStatus === 'EXPIRED' && 'মেয়াদ শেষ (EXPIRED)'}
              {displayStatus === 'CANCELLED' && 'বাতিল (CANCELLED)'}
            </span>
          </span>
        </div>

        <h3 className="hold-class-name">{hold.className || `Class ID: ${hold.classId}`}</h3>
      </div>

      {/* Countdown section for HELD status */}
      {displayStatus === 'HELD' && (
        <div className="countdown-section">
          <div className="countdown-info">
            <span className="countdown-label">
              <ClockIcon size={16} /> মেয়াদ শেষ হতে বাকি:
            </span>
            <span className={`countdown-clock ${totalSeconds <= 60 ? 'clock-danger' : ''}`}>
              {formatted}
            </span>
          </div>

          <div className="countdown-progress-track">
            <div
              className={`countdown-progress-bar ${totalSeconds <= 60 ? 'bar-danger' : ''}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="countdown-subtext">
            নির্ধারিত সময়ের মধ্যে ভর্তি ফি জমা দিন, অন্যথায় আসনটি স্বয়ংক্রিয়ভাবে বাতিল হয়ে যাবে।
          </div>
        </div>
      )}

      {/* Confirmed celebration message */}
      {displayStatus === 'CONFIRMED' && (
        <div className="hold-confirmed-banner">
          <CheckCircleIcon size={18} />
          <span>ভর্তি সফলভাবে নিশ্চিত হয়েছে! আসনটি শিক্ষার্থীর জন্য চূড়ান্ত করা হয়েছে।</span>
        </div>
      )}

      {/* Expired message */}
      {displayStatus === 'EXPIRED' && (
        <div className="hold-expired-banner">
          <AlertCircleIcon size={18} />
          <span>সময়সীমা শেষ হওয়ায় আসনটি ছেড়ে দেওয়া হয়েছে। পুনরায় নতুন আবেদন করতে পারেন।</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="hold-actions">
        {/* 'ভর্তি ফি দিন' Button: disabled if expired (§1.5) */}
        <button
          type="button"
          className="btn btn-success btn-confirm"
          disabled={!isHeldActive || confirming}
          onClick={() => onConfirm(hold.holdId)}
          title={!isHeldActive ? 'মেয়াদ শেষ হওয়ায় ভর্তি ফি জমা দেওয়া যাবে না' : 'ভর্তি নিশ্চিত করতে ফি প্রদান করুন'}
        >
          <CreditCardIcon size={16} />
          <span>
            {confirming ? 'নিশ্চিত করা হচ্ছে...' : 'ভর্তি ফি দিন (Confirm)'}
          </span>
        </button>

        {/* 'বাতিল' Button */}
        {isHeldActive && (
          <button
            type="button"
            className="btn btn-danger-outline btn-cancel"
            disabled={cancelling}
            onClick={() => onCancel(hold.holdId)}
          >
            <TrashIcon size={16} />
            <span>{cancelling ? 'বাতিল হচ্ছে...' : 'আবেদন বাতিল'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
