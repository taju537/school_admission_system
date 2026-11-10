import React, { useState } from 'react';
import { useStudent} from '../context/StudentContext';
import { UserIcon, CheckCircleIcon, AlertCircleIcon, TrashIcon } from './Icons';
import { useNotification } from '../context/NotificationContext';

export function StudentIdBar({ onIdChanged }) {
  const {
    studentId,
    inputVal,
    setInputVal,
    isValid,
    validationMessage,
    inputValidation,
    applyStudentId,
    clearStudentId,
  } = useStudent();

  const { success, error, info } = useNotification();
  const [isEditing, setIsEditing] = useState(!studentId);

  const handleApply = (e) => {
    if (e) e.preventDefault();
    const clean = inputVal.trim();
    if (!/^\d{17}$/.test(clean)) {
      error('অনুগ্রহ করে সঠিক ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর লিখুন।');
      return;
    }
    applyStudentId(clean);
    setIsEditing(false);
    success(`শিক্ষার্থী আইডি ${clean} সফলভাবে সেট করা হয়েছে!`);
    if (onIdChanged) onIdChanged(clean);
  };

  const handleClear = () => {
    clearStudentId();
    setIsEditing(true);
    info('শিক্ষার্থী আইডি মুছে ফেলা হয়েছে।');
    if (onIdChanged) onIdChanged('');
  };

  return (
    <div className="student-id-card">
      <div className="student-id-header">
        <div className="student-id-title-row">
          <div className="avatar-icon">
            <UserIcon size={22} />
          </div>
          <div>
            <h2 className="student-card-title">শিক্ষার্থীর পরিচয় (Student ID)</h2>
            <p className="student-card-subtitle">
            শিক্ষার্থীর ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর প্রবেশ করান।
            </p>
          </div>
        </div>
      </div>

      {/* Active ID Display OR Input Form */}
      {!isEditing && isValid ? (
        <div className="student-active-box">
          <div className="student-info-meta">
            <span className="badge-verified">
              <CheckCircleIcon size={16} /> সক্রিয় শিক্ষার্থী আইডি
            </span>
            <div className="student-id-display">
              <code>{studentId}</code>
             
            </div>
            <p className="storage-note">
              ব্রাউজারে সংরক্ষিত আছে
            </p>
          </div>

          <div className="student-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditing(true)}
            >
              আইডি পরিবর্তন
            </button>
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              onClick={handleClear}
              title="আইডি মুছে ফেলুন"
            >
              <TrashIcon size={14} /> মুছুন
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleApply} className="student-input-form">
          <div className="form-group-row">
            <div className="input-with-counter">
              <input
                type="text"
                className={`text-input student-input ${
                  inputVal && !inputValidation.isValid ? 'input-error' : ''
                } ${inputValidation.isValid ? 'input-success' : ''}`}
                placeholder="উদাহরণ: 20152691234567890"
                value={inputVal}
                maxLength={17}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ''); 
                  setInputVal(val);
                }}
                autoFocus
              />
              <span
                className={`digit-counter ${
                  inputVal.length === 17
                    ? 'counter-complete'
                    : inputVal.length > 0
                    ? 'counter-progress'
                    : ''
                }`}
              >
                {inputVal.length} / ১৭ অঙ্ক
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={inputVal.length !== 17}
            >
              আইডি নিশ্চিত করুন
            </button>

            {studentId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                বাতিল
              </button>
            )}
          </div>

          {/* Validation Feedback */}
          {inputVal && (
            <div
              className={`validation-hint ${
                inputValidation.isValid ? 'hint-success' : 'hint-warning'
              }`}
            >
              {inputValidation.isValid ? (
                <CheckCircleIcon size={16} />
              ) : (
                <AlertCircleIcon size={16} />
              )}
              <span>{inputValidation.message}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

