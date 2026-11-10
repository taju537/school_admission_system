import React, { useState, useEffect, useCallback, useRef } from 'react';
import { admissionClient } from '../services/admissionClient';
import { useStudent } from '../context/StudentContext';
import { useNotification } from '../context/NotificationContext';
import { HoldCard } from './HoldCard';
import { RefreshIcon, FileTextIcon, AlertCircleIcon } from './Icons';

export function MyApplications({ onHoldsUpdated }) {
  const { studentId, isValid } = useStudent();
  const { success, error, warning } = useNotification();

  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null); // { type: 'confirm'|'cancel', id }

  const onHoldsUpdatedRef = useRef(onHoldsUpdated);
  onHoldsUpdatedRef.current = onHoldsUpdated;

  const errorRef = useRef(error);
  errorRef.current = error;

  const fetchMyHolds = useCallback(async () => {
    if (!isValid || !studentId) {
      setHolds([]);
      return;
    }
    setLoading(true);
    try {
      const data = await admissionClient.getMyHolds(studentId);
      const safeData = Array.isArray(data) ? data : [];
      setHolds(safeData);
      if (onHoldsUpdatedRef.current) {
        onHoldsUpdatedRef.current(safeData);
      }
    } catch (err) {
      console.error('Error fetching student holds:', err);
      if (errorRef.current) {
        errorRef.current(err.message || 'আপনার আবেদনের তালিকা লোড করা যায়নি');
      }
    } finally {
      setLoading(false);
    }
  }, [studentId, isValid]);

  useEffect(() => {
    fetchMyHolds();
  }, [fetchMyHolds]);

  const handleConfirm = async (holdId) => {
    setActionInProgress({ type: 'confirm', id: holdId });
    try {
      await admissionClient.confirmHold(holdId, studentId);
      success('ভর্তি ফি সফলভাবে জমা হয়েছে! ভর্তি নিশ্চিত করা হলো। অভিনন্দন 🎉');
      await fetchMyHolds();
    } catch (err) {
      error(err.message || 'ভর্তি নিশ্চিত করতে সমস্যা হয়েছে।');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancel = async (holdId) => {
    const confirmed = window.confirm('আপনি কি নিশ্চিত যে আবেদনটি বাতিল করতে চান? সংরক্ষিত আসনটি অন্যদের জন্য উন্মুক্ত হয়ে যাবে।');
    if (!confirmed) return;

    setActionInProgress({ type: 'cancel', id: holdId });
    try {
      await admissionClient.cancelHold(holdId, studentId);
      warning('আবেদনটি বাতিল করা হয়েছে। সংরক্ষিত আসনটি উন্মুক্ত করা হলো।');
      await fetchMyHolds();
    } catch (err) {
      error(err.message || 'আবেদন বাতিল করতে সমস্যা হয়েছে।');
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isValid) {
    return (
      <div className="section-card empty-notice-card">
        <div className="empty-icon-wrap">
          <AlertCircleIcon size={32} />
        </div>
        <h3>শিক্ষার্থী আইডি প্রবেশ করান</h3>
        <p>চলমান আবেদন ও ভর্তি অবস্থা দেখতে উপরে ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর সেট করুন।</p>
      </div>
    );
  }

  const activeHolds = holds.filter((h) => h.status === 'HELD');
  const pastHolds = holds.filter((h) => h.status !== 'HELD');

  return (
    <div className="section-card my-applications-card">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">
            <FileTextIcon size={20} /> আমার আবেদনসমূহ (My Applications)
          </h2>
          <p className="section-subtitle">
            শিক্ষার্থী ({studentId})-এর সকল আবেদন, বর্তমান স্থিতি এবং ফি প্রদানের সময়সীমা
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchMyHolds}
          disabled={loading}
          title="হালনাগাদ করুন"
        >
          <RefreshIcon size={14} className={loading ? 'spin' : ''} />
          <span>{loading ? 'লোড হচ্ছে...' : 'রিফ্রেশ'}</span>
        </button>
      </div>

      {loading && holds.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>আবেদনের তথ্য অনুসন্ধান করা হচ্ছে...</p>
        </div>
      ) : holds.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">এই শিক্ষার্থীর কোনো আবেদন পাওয়া যায়নি</p>
          <p className="empty-desc">নিচের তালিকা থেকে আপনার পছন্দের ক্লাসে "আবেদন করুন" বাটনে ক্লিক করে সিট বুক করুন।</p>
        </div>
      ) : (
        <div className="holds-container">
          {/* Active HELD applications first */}
          {activeHolds.length > 0 && (
            <div className="holds-group">
              <h3 className="group-subheading">
                ⏳ চলমান সংরক্ষণ (নির্ধারিত সময়ের মধ্যে ফি জমা দিন):
              </h3>
              <div className="holds-grid">
                {activeHolds.map((h) => (
                  <HoldCard
                    key={h.holdId}
                    hold={h}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    confirming={actionInProgress?.type === 'confirm' && actionInProgress?.id === h.holdId}
                    cancelling={actionInProgress?.type === 'cancel' && actionInProgress?.id === h.holdId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past / Confirmed / Expired / Cancelled holds */}
          {pastHolds.length > 0 && (
            <div className="holds-group">
              <h3 className="group-subheading">
                📋 আবেদনের পূর্ববর্তী ইতিহাস:
              </h3>
              <div className="holds-grid">
                {pastHolds.map((h) => (
                  <HoldCard
                    key={h.holdId}
                    hold={h}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    confirming={false}
                    cancelling={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
