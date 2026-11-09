import React, { useState } from 'react';
import { StudentProvider } from './context/StudentContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ToastContainer } from './components/Toast';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('parent'); // 'parent' | 'admin'

  return (
    <div className="app-layout">
      {/* Navbar with Role Switcher & Status */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="main-container">
        {activeTab === 'parent' ? <ParentDashboard /> : <AdminDashboard />}
      </main>

      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <p>
            <strong>বিদ্যালয় ভর্তি ব্যবস্থা (School Admission System)</strong> • অনলাইনেই দ্রুত ও স্বচ্ছ ভর্তি প্রক্রিয়া
          </p>
          <p className="footer-notes">
            .NET 8 + PostgreSQL + React 18+ • টেকনিক্যাল স্পেসিফিকেশন অনুযায়ী লগইন-বিহীন ১৭ অঙ্কের জন্ম নিবন্ধন আইডি ভিত্তিক সিস্টেম।
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <StudentProvider>
        <AppContent />
      </StudentProvider>
    </NotificationProvider>
  );
}
