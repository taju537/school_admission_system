/**
 * School Admission System - API Service
 * Implements the exact API contracts specified in §1.4 of the assignment brief.
 */

const getBaseUrl = () => {
  return (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
};

/**
 * Custom API Error with status and user-friendly Bengali message
 */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Translates server or HTTP errors to user-friendly Bengali messages (§1.5)
 */
function translateError(error, status) {
  if (error && error.message && error.message.includes('Failed to fetch')) {
    return 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে নিশ্চিত করুন ব্যাকএন্ড চালু আছে (http://localhost:8080)।';
  }

  if (status === 409) {
    return error?.serverMessage || 'আসন খালি নেই অথবা এই ক্লাসে শিক্ষার্থীর ইতিমধ্যে সক্রিয় আবেদন/ভর্তি রয়েছে।';
  }
  if (status === 400) {
    return error?.serverMessage || 'ভুল ইনপুট প্রদান করা হয়েছে। অনুগ্রহ করে তথ্য যাচাই করুন।';
  }
  if (status === 404) {
    return error?.serverMessage || 'অনুরোধকৃত ক্লাস বা আবেদনের তথ্য পাওয়া যায়নি।';
  }
  if (status === 500) {
    return 'সার্ভারে অভ্যন্তরীণ ত্রুটি ঘটেছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }

  return error?.serverMessage || error?.message || 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।';
}

/**
 * Standard fetch wrapper with timeout, JSON parsing, and error formatting
 */
async function request(endpoint, options = {}) {
  const url = `${getBaseUrl()}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 8000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const serverMessage = data?.message || data?.error || (typeof data === 'string' ? data : null);
      const bengaliMsg = translateError({ serverMessage }, response.status);
      throw new ApiError(bengaliMsg, response.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    const bengaliMsg = translateError(err, err.name === 'AbortError' ? 408 : 0);
    throw new ApiError(bengaliMsg, err.status || 0, err);
  }
}

export const api = {
  getBaseUrl,

  /**
   * 1. POST /classes
   * Request: { "name": "Class 6 - Morning Shift", "totalSeats": 120 }
   * Response: { "id": "c_123", "name": "Class 6 - Morning Shift", "totalSeats": 120 }
   */
  async createClass({ name, totalSeats }) {
    return request('/classes', {
      method: 'POST',
      body: JSON.stringify({
        name: String(name).trim(),
        totalSeats: Number(totalSeats),
      }),
    });
  },

  /**
   * 2. GET /classes
   * Response: [ { id, name, totalSeats, heldSeats, confirmedSeats, availableSeats } ]
   */
  async getClasses() {
    return request('/classes', {
      method: 'GET',
    });
  },

  /**
   * 3. GET /classes/{classId}
   * Response: { id, name, totalSeats, heldSeats, confirmedSeats, availableSeats }
   */
  async getClassById(classId) {
    return request(`/classes/${encodeURIComponent(classId)}`, {
      method: 'GET',
    });
  },

  /**
   * 4. POST /classes/{classId}/holds
   * Header: X-Student-Id
   * Response 201: { holdId, classId, studentId, status, expiresAt }
   * Response 409: Seat not available / Already held
   */
  async createHold(classId, studentId) {
    return request(`/classes/${encodeURIComponent(classId)}/holds`, {
      method: 'POST',
      headers: {
        'X-Student-Id': String(studentId).trim(),
      },
    });
  },

  /**
   * 5. GET /holds/{holdId}
   * Response 200: { holdId, classId, status, expiresAt }
   * status: HELD, CONFIRMED, EXPIRED, CANCELLED
   */
  async getHold(holdId) {
    return request(`/holds/${encodeURIComponent(holdId)}`, {
      method: 'GET',
    });
  },

  /**
   * 6. POST /holds/{holdId}/confirm
   * Header: X-Student-Id
   * Response 200: { holdId, status: "CONFIRMED" }
   */
  async confirmHold(holdId, studentId) {
    return request(`/holds/${encodeURIComponent(holdId)}/confirm`, {
      method: 'POST',
      headers: {
        'X-Student-Id': String(studentId).trim(),
      },
    });
  },

  /**
   * 7. DELETE /holds/{holdId}
   * Header: X-Student-Id
   * Response 204: No Content
   */
  async cancelHold(holdId, studentId) {
    return request(`/holds/${encodeURIComponent(holdId)}`, {
      method: 'DELETE',
      headers: {
        'X-Student-Id': String(studentId).trim(),
      },
    });
  },

  /**
   * 8. GET /me/holds
   * Header: X-Student-Id
   * Response 200: [ { holdId, classId, className, status, expiresAt } ]
   */
  async getMyHolds(studentId) {
    return request('/me/holds', {
      method: 'GET',
      headers: {
        'X-Student-Id': String(studentId).trim(),
      },
    });
  },

  /**
   * Quick health check / ping to detect if backend is currently running
   */
  async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${getBaseUrl()}/classes`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },
};
