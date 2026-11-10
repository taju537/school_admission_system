import React, { useState } from 'react';
import { useClassesPolling } from '../hooks/useClassesPolling';
import { admissionClient } from '../services/admissionClient';
import { useNotification } from '../context/NotificationContext';
import { ShieldIcon, PlusIcon, RefreshIcon, SchoolIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon } from './Icons';

export function AdminDashboard() {
  const { classes, loading, refreshing, refresh } = useClassesPolling(4000);
  const { success, error, warning } = useNotification();

  // Create Class Form State
  const [name, setName] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick preset templates
  const classPresets = [
    'Class 6 - Morning Shift',
    'Class 6 - Day Shift',
    'Class 7 - Morning Shift',
    'Class 7 - Day Shift',
    'Class 8 - Morning Shift',
    'Class 8 - Day Shift',
    'Class 9 - Science (Morning)',
    'Class 9 - Science (Day)',
  ];

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const seatsNum = parseInt(totalSeats, 10);

    if (!cleanName) {
      warning('অনুগ্রহ করে ক্লাসের নাম ও শিফট লিখুন।');
      return;
    }

    if (isNaN(seatsNum) || seatsNum <= 0) {
      warning('মোট আসন সংখ্যা অবশ্যই ০ থেকে বড় একটি সংখ্যা হতে হবে।');
      return;
    }

    setSubmitting(true);
    try {
      const created = await admissionClient.createClass({
        name: cleanName,
        totalSeats: seatsNum,
      });
      success(`ক্লাস "${created.name}" (আসন: ${created.totalSeats}) সফলভাবে তৈরি হয়েছে!`);
      setName('');
      setTotalSeats('');
      refresh();
    } catch (err) {
      console.error('Create class error:', err);
      error(err.message || 'ক্লাস তৈরিতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute aggregate statistics
  const totalClasses = classes.length;
  const totalCapacity = classes.reduce((sum, c) => sum + (c.totalSeats || 0), 0);
  const totalConfirmed = classes.reduce((sum, c) => sum + (c.confirmedSeats || 0), 0);
  const totalHeld = classes.reduce((sum, c) => sum + (c.heldSeats || 0), 0);
  const totalAvailable = classes.reduce((sum, c) => sum + (c.availableSeats || 0), 0);

  return (
    <div className="dashboard-content admin-dashboard">
      {/* Top Banner */}
      <div className="admin-banner-card">
        <div className="admin-banner-title-group">
          <div className="admin-badge-icon">
            <ShieldIcon size={24} />
          </div>
          <div>
            <h1 className="admin-title">স্কুল অ্যাডমিন ড্যাশবোর্ড (School Admin)</h1>
            <p className="admin-subtitle">
              নতুন ক্লাস ও শিফট তৈরি করুন এবং সকল ক্লাসের আসন বরাদ্দ ও পরিসংখ্যান পর্যবেক্ষণ করুন।
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={refresh}
          disabled={refreshing}
          title="সকল তথ্য হালনাগাদ করুন"
        >
          <RefreshIcon size={14} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'আপডেট হচ্ছে...' : 'হালনাগাদ'}</span>
        </button>
      </div>

      {/* Overview Analytics Cards */}
      <div className="analytics-grid">
        <div className="analytics-card metric-total-classes">
          <div className="metric-header">
            <span className="metric-title">মোট ক্লাস সংখ্যা</span>
            <SchoolIcon size={20} className="metric-icon" />
          </div>
          <div className="metric-number">{totalClasses}</div>
          <div className="metric-sub">প্রতিটি শিফট আলাদা ক্লাস</div>
        </div>

        <div className="analytics-card metric-capacity">
          <div className="metric-header">
            <span className="metric-title">মোট আসন সক্ষমতা</span>
            <span className="metric-pill">১০০%</span>
          </div>
          <div className="metric-number">{totalCapacity}</div>
          <div className="metric-sub">বিদ্যালয়ের সর্বমোট আসন</div>
        </div>

        <div className="analytics-card metric-confirmed">
          <div className="metric-header">
            <span className="metric-title">নিশ্চিত ভর্তি</span>
            <CheckCircleIcon size={20} className="metric-icon text-success" />
          </div>
          <div className="metric-number text-success">{totalConfirmed}</div>
          <div className="metric-sub">
            {totalCapacity > 0 ? ((totalConfirmed / totalCapacity) * 100).toFixed(1) : 0}% পূর্ণ
          </div>
        </div>

        <div className="analytics-card metric-held">
          <div className="metric-header">
            <span className="metric-title">হোল্ডে থাকা আসন</span>
            <ClockIcon size={20} className="metric-icon text-warning" />
          </div>
          <div className="metric-number text-warning">{totalHeld}</div>
          <div className="metric-sub">ফি প্রদানের অপেক্ষায়</div>
        </div>

        <div className="analytics-card metric-available">
          <div className="metric-header">
            <span className="metric-title">খালি আসন</span>
            <span className="metric-pill bg-green-light">উন্মুক্ত</span>
          </div>
          <div className="metric-number text-primary">{totalAvailable}</div>
          <div className="metric-sub">আবেদনের জন্য প্রস্তুত</div>
        </div>
      </div>

      <div className="admin-two-col">
        {/* Left Column: Create Class Form */}
        <div className="section-card create-class-card">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">
                <PlusIcon size={18} /> নতুন ক্লাস ও শিফট তৈরি করুন
              </h2>
              <p className="section-subtitle">
              নতুন ক্লাস এবং আসন সংখ্যা নির্ধারণ করুন।
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateClass} className="create-class-form">
            <div className="form-group">
              <label htmlFor="classNameInput" className="form-label">
                ক্লাসের নাম ও শিফট <span className="required-star">*</span>
              </label>
              <input
                id="classNameInput"
                type="text"
                className="text-input"
                placeholder="যেমন: Class 6 - Morning Shift"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Quick Presets */}
            <div className="presets-wrapper">
              <span className="presets-label">দ্রুত নাম নির্বাচন করুন:</span>
              <div className="presets-chips">
                {classPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="preset-chip"
                    onClick={() => setName(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="totalSeatsInput" className="form-label">
                মোট আসন সংখ্যা (Total Seats) <span className="required-star">*</span>
              </label>
              <input
                id="totalSeatsInput"
                type="number"
                min="1"
                max="1000"
                className="text-input"
                placeholder="যেমন: 120"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                required
              />
            
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting || !name.trim() || !totalSeats}
            >
              <PlusIcon size={18} />
              <span>{submitting ? 'ক্লাস তৈরি হচ্ছে...' : 'ক্লাস যুক্ত করুন (Create Class)'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Class Status Table */}
        <div className="section-card classes-overview-card">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">
                📊 ক্লাস ও আসন বিবরণী (Real-time Status)
              </h2>
              <p className="section-subtitle">
                প্রতি ৪ সেকেন্ডে স্বয়ংক্রিয়ভাবে ব্যাকএন্ড থেকে আসন হালনাগাদ হয়।
              </p>
            </div>
          </div>

          {loading && classes.length === 0 ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>ক্লাসের তথ্য লোড করা হচ্ছে...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">এখনো কোনো ক্লাস তৈরি করা হয়নি</p>
              <p className="empty-desc">বাম পাশের ফরম ব্যবহার করে প্রথম ক্লাসটি তৈরি করুন।</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>আইডি</th>
                    <th>ক্লাসের নাম</th>
                    <th>মোট আসন</th>
                    <th>হোল্ডে</th>
                    <th>নিশ্চিত</th>
                    <th>খালি আসন</th>
                    <th>আসন পূর্ণতার হার</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => {
                    const confirmedRatio =
                      cls.totalSeats > 0 ? (cls.confirmedSeats / cls.totalSeats) * 100 : 0;
                    const heldRatio =
                      cls.totalSeats > 0 ? (cls.heldSeats / cls.totalSeats) * 100 : 0;
                    const availableRatio =
                      cls.totalSeats > 0 ? (cls.availableSeats / cls.totalSeats) * 100 : 0;

                    return (
                      <tr key={cls.id}>
                        <td>
                          <code className="code-tag">{cls.id}</code>
                        </td>
                        <td>
                          <strong>{cls.name}</strong>
                        </td>
                        <td className="text-center">{cls.totalSeats}</td>
                        <td className="text-center">
                          <span className="badge-held-mini">{cls.heldSeats}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge-confirmed-mini">{cls.confirmedSeats}</span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge-available-mini ${
                              cls.availableSeats === 0 ? 'zero' : ''
                            }`}
                          >
                            {cls.availableSeats}
                          </span>
                        </td>
                        <td>
                          <div className="table-bar-track" title={`নিশ্চিত: ${cls.confirmedSeats}, হোল্ড: ${cls.heldSeats}, খালি: ${cls.availableSeats}`}>
                            <div
                              className="bar-segment bar-confirmed"
                              style={{ width: `${confirmedRatio}%` }}
                            ></div>
                            <div
                              className="bar-segment bar-held"
                              style={{ width: `${heldRatio}%` }}
                            ></div>
                          </div>
                          <span className="ratio-text">
                            {(confirmedRatio + heldRatio).toFixed(0)}% বুকড
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

