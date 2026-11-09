import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'school_admission_student_id';
export const DEMO_STUDENT_ID = '20152691234567890'; // Exact ID from assignment brief §1.4

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [studentId, setStudentIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [inputVal, setInputVal] = useState(studentId);

  // Sync with localStorage
  useEffect(() => {
    try {
      if (studentId) {
        localStorage.setItem(STORAGE_KEY, studentId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync student ID with localStorage:', e);
    }
  }, [studentId]);

  const validateId = (id) => {
    if (!id) return { isValid: false, message: '১৭ অঙ্কের জন্ম নিবন্ধন নম্বর লিখুন' };
    const cleaned = String(id).trim();
    if (!/^\d+$/.test(cleaned)) {
      return { isValid: false, message: 'শুধুমাত্র সংখ্যা (Digits) গ্রহণযোগ্য' };
    }
    if (cleaned.length < 17) {
      return { isValid: false, message: `আরও ${17 - cleaned.length}টি অঙ্ক প্রয়োজন (${cleaned.length}/১৭)` };
    }
    if (cleaned.length > 17) {
      return { isValid: false, message: `১৭ অঙ্কের বেশি হয়েছে (${cleaned.length}/১৭)` };
    }
    return { isValid: true, message: 'সঠিক ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর ✅' };
  };

  const validation = validateId(studentId);
  const inputValidation = validateId(inputVal);

  const applyStudentId = (id) => {
    const cleaned = String(id).trim();
    setStudentIdState(cleaned);
    setInputVal(cleaned);
  };

  const clearStudentId = () => {
    setStudentIdState('');
    setInputVal('');
  };

  const setDemoId = (customId = DEMO_STUDENT_ID) => {
    applyStudentId(customId);
  };

  return (
    <StudentContext.Provider
      value={{
        studentId,
        inputVal,
        setInputVal,
        isValid: validation.isValid,
        validationMessage: validation.message,
        inputValidation,
        applyStudentId,
        clearStudentId,
        setDemoId,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) {
    throw new Error('useStudent must be used within StudentProvider');
  }
  return ctx;
}
