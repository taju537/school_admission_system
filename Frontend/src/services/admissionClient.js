import { api } from './api';
import { mockApi } from './mockApi';

const STORAGE_MODE_KEY = 'school_admission_client_mode'; // 'live' | 'mock' | 'auto'

export const admissionClient = {
  getMode() {
    return localStorage.getItem(STORAGE_MODE_KEY) || 'auto';
  },

  setMode(mode) {
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  },

  async isBackendLive() {
    return api.checkBackendHealth();
  },

  async executeWithFallback(apiFn, mockFn) {
    const forcedMode = this.getMode();
    if (forcedMode === 'mock') {
      return mockFn();
    }

    try {
      return await apiFn();
    } catch (err) {
      // If network failure / connection refused and in auto mode, fallback to mock with warning
      if (
        forcedMode === 'auto' &&
        (err.status === 0 ||
          err.message?.includes('সংযোগ স্থাপন করা যায়নি') ||
          err.message?.includes('Failed to fetch'))
      ) {
        console.warn('Backend server unreachable, falling back to local simulation mode:', err.message);
        return mockFn();
      }
      throw err;
    }
  },

  async getClasses() {
    return this.executeWithFallback(
      () => api.getClasses(),
      () => mockApi.getClasses()
    );
  },

  async getClassById(classId) {
    return this.executeWithFallback(
      () => api.getClassById(classId),
      () => mockApi.getClassById(classId)
    );
  },

  async createClass({ name, totalSeats }) {
    return this.executeWithFallback(
      () => api.createClass({ name, totalSeats }),
      () => mockApi.createClass({ name, totalSeats })
    );
  },

  async createHold(classId, studentId) {
    return this.executeWithFallback(
      () => api.createHold(classId, studentId),
      () => mockApi.createHold(classId, studentId)
    );
  },

  async getHold(holdId) {
    return this.executeWithFallback(
      () => api.getHold(holdId),
      () => mockApi.getHold(holdId)
    );
  },

  async confirmHold(holdId, studentId) {
    return this.executeWithFallback(
      () => api.confirmHold(holdId, studentId),
      () => mockApi.confirmHold(holdId, studentId)
    );
  },

  async cancelHold(holdId, studentId) {
    return this.executeWithFallback(
      () => api.cancelHold(holdId, studentId),
      () => mockApi.cancelHold(holdId, studentId)
    );
  },

  async getMyHolds(studentId) {
    return this.executeWithFallback(
      () => api.getMyHolds(studentId),
      () => mockApi.getMyHolds(studentId)
    );
  },
};
