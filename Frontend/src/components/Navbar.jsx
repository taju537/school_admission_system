import React, { useState, useEffect } from 'react';
import { SchoolIcon, UserIcon, ShieldIcon, RefreshIcon } from './Icons';
import { admissionClient } from '../services/admissionClient';
import { useStudent } from '../context/StudentContext';

export function Navbar({ activeTab, setActiveTab }) {
  const { studentId, isValid } = useStudent();
  const [isLive, setIsLive] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(false);

  const checkStatus = async () => {
    setCheckingBackend(true);
    const live = await admissionClient.isBackendLive();
    setIsLive(live);
    setCheckingBackend(false);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Brand */}
        <div className="brand-group">
          <div className="brand-icon-wrapper">
            <SchoolIcon size={26} className="text-white" />
          </div>
          <div>
            <div className="brand-title">স্কুল ভর্তি পোর্টাল</div>
            <div className="brand-subtitle">School Admission System • অনলাইনেই দ্রুত ভর্তি</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'parent' ? 'active' : ''}`}
            onClick={() => setActiveTab('parent')}
          >
            <UserIcon size={18} />
            <span>অভিভাবক ড্যাশবোর্ড (Parent Portal)</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <ShieldIcon size={18} />
            <span>অ্যাডমিন ড্যাশবোর্ড (Admin Dashboard)</span>
          </button>
        </nav>

        {/* Server & Student Badges */}
        <div className="header-status-group">
          {isValid && (
            <div className="active-student-pill" title={`Active Student ID: ${studentId}`}>
              <span className="dot-green"></span>
              <span className="pill-text">আইডি: {studentId.slice(0, 4)}...{studentId.slice(-4)}</span>
            </div>
          )}

          <div
            className={`status-pill ${isLive ? 'status-live' : 'status-sim'}`}
            title={
              isLive
                ? 'Backend is connected and responding at http://localhost:8080'
                : 'Backend offline: Using built-in local simulation engine'
            }
          >
            <span className={`status-indicator ${isLive ? 'pulse-live' : 'pulse-sim'}`}></span>
            <span>{isLive ? 'লাইভ API কানেক্টেড' : 'সিমুলেশন মোড'}</span>
            <button
              type="button"
              className="refresh-mini-btn"
              onClick={checkStatus}
              disabled={checkingBackend}
              title="পুনরায় ব্যাকএন্ড সংযোগ পরীক্ষা করুন"
            >
              <RefreshIcon size={12} className={checkingBackend ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
