import { api } from './api';
import { mockApi } from './mockApi';

const STORAGE_MODE_KEY = 'school_admission_client_mode'; // 'live' | 'mock' | 'auto'

let lastUnreachableTimestamp = 0;
const OFFLINE_RETRY_COOLDOWN_MS = 10000; // 10-second cooldown to prevent console log floods

export const admissionClient = {
  getMode() {
    return localStorage.getItem(STORAGE_MODE_KEY) || 'auto';
  },

  setMode(mode) {
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  },

  async isBackendLive() {
    const live = await api.checkBackendHealth();
    if (live) {
      lastUnreachableTimestamp = 0;
    } else {
      lastUnreachableTimestamp = Date.now();
    }
    return live;
  },

  async executeWithFallback(apiFn, mockFn) {
    const forcedMode = this.getMode();
    if (forcedMode === 'mock') {
      return mockFn();
    }

    // If recently failed and still in auto mode, skip network request during cooldown
    const isRecentlyOffline =
      lastUnreachableTimestamp > 0 &&
      Date.now() - lastUnreachableTimestamp < OFFLINE_RETRY_COOLDOWN_MS;

    if (forcedMode === 'auto' && isRecentlyOffline) {
      return mockFn();
    }

    try {
      const result = await apiFn();
      lastUnreachableTimestamp = 0; // reset on success
      return result;
    } catch (err) {
      // If network failure / connection refused and in auto mode, fallback to mock
      if (
        forcedMode === 'auto' &&
        (err.status === 0 ||
          err.message?.includes('সংযোগ স্থাপন করা যায়নি') ||
          err.message?.includes('Failed to fetch'))
      ) {
        lastUnreachableTimestamp = Date.now();
        console.warn('Backend server unreachable at http://localhost:8080. Operating in offline simulation mode.');
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
