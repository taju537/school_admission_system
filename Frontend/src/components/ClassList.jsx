import React, { useState } from 'react';
import { useStudent } from '../context/StudentContext';
import { useNotification } from '../context/NotificationContext';
import { admissionClient } from '../services/admissionClient';
import { RefreshIcon, SearchIcon, CheckCircleIcon, AlertCircleIcon, PlusIcon } from './Icons';

export function ClassList({ classes, loading, refreshing, onRefresh, onHoldCreated, existingHolds = [] }) {
  const { studentId, isValid } = useStudent();
  const { success, error, warning } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [applyingClassId, setApplyingClassId] = useState(null);

  // Check if student already has active hold or confirmed admission in a class (§1.5 Rule 3)
  const getStudentClassStatus = (classId) => {
    if (!existingHolds || existingHolds.length === 0) return null;
    const match = existingHolds.find(
      (h) => h.classId === classId && (h.status === 'HELD' || h.status === 'CONFIRMED')
    );
    return match ? match.status : null;
  };

  const handleApply = async (cls) => {
    if (!isValid || !studentId) {
      warning('আবেদন করার আগে অনুগ্রহ করে উপরে ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর দিন।');
      return;
    }

    if (cls.availableSeats <= 0) {
      error(`দুঃখিত! ${cls.name}-এ আর কোনো আসন খালি নেই।`);
      return;
    }

    const currentStatus = getStudentClassStatus(cls.id);
    if (currentStatus === 'HELD') {
      warning('এই ক্লাসে আপনার একটি আসন ইতিমধ্যে হোল্ডে আছে। অনুগ্রহ করে ফি প্রদান করুন।');
      return;
    }
    if (currentStatus === 'CONFIRMED') {
      warning('এই ক্লাসে আপনার ভর্তি ইতিমধ্যে নিশ্চিত হয়েছে!');
      return;
    }

    setApplyingClassId(cls.id);
    try {
      const res = await admissionClient.createHold(cls.id, studentId);
      success(`আসন সফলভাবে হোল্ড করা হয়েছে! ১০ মিনিটের মধ্যে ফি পরিশোধ করে ভর্তি নিশ্চিত করুন।`);
      if (onHoldCreated) onHoldCreated(res);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Apply error:', err);
      error(err.message || 'আবেদন সম্পন্ন করা সম্ভব হয়নি।');
    } finally {
      setApplyingClassId(null);
    }
  };

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="section-card class-list-card">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">
            🏫 ক্লাস ও আসন তালিকা (Available Classes)
          </h2>
          <p className="section-subtitle">
            আগে আসলে আগে পাবেন ভিত্তিতে আসন বরাদ্দ করা হয়। পছন্দসই ক্লাসের পাশে "আবেদন করুন" বাটনে চাপুন।
          </p>
        </div>

        <div className="header-controls">
          <div className="search-box">
            <SearchIcon size={16} className="search-icon" />
            <input
              type="text"
              placeholder="ক্লাসের নাম বা শিফট খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={refreshing}
            title="আসন সংখ্যা তাৎক্ষণিক হালনাগাদ করুন"
          >
            <RefreshIcon size={14} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'আপডেট হচ্ছে...' : 'হালনাগাদ'}</span>
          </button>
        </div>
      </div>

      {loading && classes.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>ক্লাসের তথ্য ও আসন সংখ্যা লোড হচ্ছে...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">কোনো ক্লাস খুঁজে পাওয়া যায়নি</p>
          <p className="empty-desc">
            {searchTerm
              ? `"${searchTerm}" এর সাথে মিলে এমন কোনো ক্লাস নেই।`
              : 'বর্তমানে কোনো ক্লাস যুক্ত করা হয়নি। অ্যাডমিন ড্যাশবোর্ড থেকে ক্লাস তৈরি করুন।'}
          </p>
        </div>
      ) : (
        <div className="classes-grid">
          {filtered.map((cls) => {
            const studentStatus = getStudentClassStatus(cls.id);
            const isFull = cls.availableSeats <= 0;
            const isApplying = applyingClassId === cls.id;

            // Occupancy calculation
            const confirmedRatio = cls.totalSeats > 0 ? (cls.confirmedSeats / cls.totalSeats) * 100 : 0;
            const heldRatio = cls.totalSeats > 0 ? (cls.heldSeats / cls.totalSeats) * 100 : 0;

            return (
              <div
                key={cls.id}
                className={`class-card ${isFull ? 'class-card-full' : ''} ${
                  studentStatus ? 'class-card-applied' : ''
                }`}
              >
                <div className="class-card-header">
                  <div>
                    <h3 className="class-name">{cls.name}</h3>
                    <span className="class-id-tag">আইডি: {cls.id}</span>
                  </div>

                  {studentStatus === 'CONFIRMED' && (
                    <span className="badge-applied badge-success">
                      <CheckCircleIcon size={14} /> ভর্তি নিশ্চিত
                    </span>
                  )}
                  {studentStatus === 'HELD' && (
                    <span className="badge-applied badge-warning">
                      <AlertCircleIcon size={14} /> হোল্ডে আছে
                    </span>
                  )}
                  {!studentStatus && isFull && (
                    <span className="badge-applied badge-danger">আসন পূর্ণ</span>
                  )}
                  {!studentStatus && !isFull && (
                    <span className="badge-applied badge-available">
                      {cls.availableSeats}টি আসন খালি
                    </span>
                  )}
                </div>

                {/* Seat Breakdown Grid */}
                <div className="seats-breakdown">
                  <div className="seat-stat total">
                    <span className="stat-label">মোট আসন</span>
                    <span className="stat-value">{cls.totalSeats}</span>
                  </div>
                  <div className="seat-stat confirmed">
                    <span className="stat-label">নিশ্চিত</span>
                    <span className="stat-value">{cls.confirmedSeats}</span>
                  </div>
                  <div className="seat-stat held">
                    <span className="stat-label">হোল্ডে</span>
                    <span className="stat-value">{cls.heldSeats}</span>
                  </div>
                  <div className="seat-stat available">
                    <span className="stat-label">খালি আছে</span>
                    <span className="stat-value highlight">{cls.availableSeats}</span>
                  </div>
                </div>

                {/* Visual Capacity Bar */}
                <div className="capacity-bar-track" title={`নিশ্চিত: ${cls.confirmedSeats}, হোল্ড: ${cls.heldSeats}, খালি: ${cls.availableSeats}`}>
                  <div
                    className="bar-segment bar-confirmed"
                    style={{ width: `${confirmedRatio}%` }}
                  ></div>
                  <div
                    className="bar-segment bar-held"
                    style={{ width: `${heldRatio}%` }}
                  ></div>
                </div>

                {/* Card Action */}
                <div className="class-card-footer">
                  {studentStatus === 'CONFIRMED' ? (
                    <div className="footer-notice success-notice">
                      <CheckCircleIcon size={15} />
                      <span>ভর্তি সম্পন্ন হয়েছে</span>
                    </div>
                  ) : studentStatus === 'HELD' ? (
                    <div className="footer-notice warning-notice">
                      <AlertCircleIcon size={15} />
                      <span>উপরে "আমার আবেদন" থেকে ফি দিন</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`btn btn-block ${
                        isFull ? 'btn-disabled' : 'btn-primary'
                      }`}
                      disabled={isFull || isApplying || !isValid}
                      onClick={() => handleApply(cls)}
                      title={
                        !isValid
                          ? 'আগে উপরে ১৭ অঙ্কের শিক্ষার্থী আইডি দিন'
                          : isFull
                          ? 'এই ক্লাসে কোনো আসন খালি নেই'
                          : 'এই ক্লাসের একটি আসন সাময়িকভাবে ধরে রাখুন'
                      }
                    >
                      <PlusIcon size={16} />
                      <span>
                        {isApplying
                          ? 'আবেদন প্রসেস হচ্ছে...'
                          : isFull
                          ? 'আসন খালি নেই (Full)'
                          : 'আবেদন করুন (Hold Seat)'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
