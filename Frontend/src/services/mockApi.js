/**
 * Local Simulation Service (Mock Data Fallback)
 * Allows exploring and demonstrating all features of the frontend even when
 * the backend is not yet started or running in standalone UI mode.
 * Adheres strictly to all backend business rules from §1.5 of the assignment.
 */

const STORAGE_CLASSES_KEY = 'school_admission_mock_classes';
const STORAGE_HOLDS_KEY = 'school_admission_mock_holds';
const HOLD_DURATION_SECONDS = 600; // 10 minutes default

const INITIAL_CLASSES = [
  {
    id: 'c_101',
    name: 'Class 6 - Morning Shift',
    totalSeats: 120,
    heldSeats: 14,
    confirmedSeats: 82,
    availableSeats: 24,
  },
  {
    id: 'c_102',
    name: 'Class 6 - Day Shift',
    totalSeats: 120,
    heldSeats: 8,
    confirmedSeats: 104,
    availableSeats: 8,
  },
  {
    id: 'c_103',
    name: 'Class 7 - Morning Shift',
    totalSeats: 90,
    heldSeats: 20,
    confirmedSeats: 65,
    availableSeats: 5,
  },
  {
    id: 'c_104',
    name: 'Class 7 - Day Shift',
    totalSeats: 90,
    heldSeats: 10,
    confirmedSeats: 80,
    availableSeats: 0,
  },
  {
    id: 'c_105',
    name: 'Class 8 - Morning Shift',
    totalSeats: 100,
    heldSeats: 5,
    confirmedSeats: 60,
    availableSeats: 35,
  },
];

function getStoredClasses() {
  const raw = localStorage.getItem(STORAGE_CLASSES_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_CLASSES_KEY, JSON.stringify(INITIAL_CLASSES));
    return INITIAL_CLASSES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_CLASSES;
  }
}

function saveStoredClasses(classes) {
  localStorage.setItem(STORAGE_CLASSES_KEY, JSON.stringify(classes));
}

function getStoredHolds() {
  const raw = localStorage.getItem(STORAGE_HOLDS_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    const now = Date.now();
    // Auto expire any holds whose time has passed
    return list.map((h) => {
      if (h.status === 'HELD' && new Date(h.expiresAt).getTime() <= now) {
        return { ...h, status: 'EXPIRED' };
      }
      return h;
    });
  } catch {
    return [];
  }
}

function saveStoredHolds(holds) {
  localStorage.setItem(STORAGE_HOLDS_KEY, JSON.stringify(holds));
}

export const mockApi = {
  async getClasses() {
    await new Promise((r) => setTimeout(r, 120));
    return getStoredClasses();
  },

  async getClassById(classId) {
    await new Promise((r) => setTimeout(r, 100));
    const list = getStoredClasses();
    const item = list.find((c) => c.id === classId);
    if (!item) throw new Error('ক্লাস পাওয়া যায়নি');
    return item;
  },

  async createClass({ name, totalSeats }) {
    await new Promise((r) => setTimeout(r, 180));
    const list = getStoredClasses();
    const newClass = {
      id: `c_${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      totalSeats: Number(totalSeats),
      heldSeats: 0,
      confirmedSeats: 0,
      availableSeats: Number(totalSeats),
    };
    list.unshift(newClass);
    saveStoredClasses(list);
    return { id: newClass.id, name: newClass.name, totalSeats: newClass.totalSeats };
  },

  async createHold(classId, studentId) {
    await new Promise((r) => setTimeout(r, 200));
    const classes = getStoredClasses();
    const cls = classes.find((c) => c.id === classId);
    if (!cls) throw new Error('ক্লাস পাওয়া যায়নি');

    const holds = getStoredHolds();
    // Check rule 3: One active hold/admission per student in this class
    const existingActive = holds.find(
      (h) =>
        h.classId === classId &&
        h.studentId === studentId &&
        (h.status === 'HELD' || h.status === 'CONFIRMED')
    );
    if (existingActive) {
      const err = new Error('শিক্ষার্থীর ইতিমধ্যে এই ক্লাসে একটি সক্রিয় আবেদন বা নিশ্চিত ভর্তি রয়েছে।');
      err.status = 409;
      throw err;
    }

    // Check seats
    if (cls.availableSeats <= 0) {
      const err = new Error('দুঃখিত, এই ক্লাসে কোনো আসন খালি নেই!');
      err.status = 409;
      throw err;
    }

    // Deduct available, increase held
    cls.heldSeats += 1;
    cls.availableSeats -= 1;
    saveStoredClasses(classes);

    const expiresAt = new Date(Date.now() + HOLD_DURATION_SECONDS * 1000).toISOString();
    const newHold = {
      holdId: `h_${Date.now().toString().slice(-4)}`,
      classId: cls.id,
      className: cls.name,
      studentId: String(studentId),
      status: 'HELD',
      expiresAt,
    };
    holds.unshift(newHold);
    saveStoredHolds(holds);

    return {
      holdId: newHold.holdId,
      classId: newHold.classId,
      studentId: newHold.studentId,
      status: newHold.status,
      expiresAt: newHold.expiresAt,
    };
  },

  async getHold(holdId) {
    await new Promise((r) => setTimeout(r, 100));
    const holds = getStoredHolds();
    const item = holds.find((h) => h.holdId === holdId);
    if (!item) throw new Error('আবেদন পাওয়া যায়নি');
    return item;
  },

  async confirmHold(holdId, studentId) {
    await new Promise((r) => setTimeout(r, 200));
    const holds = getStoredHolds();
    const hold = holds.find((h) => h.holdId === holdId);
    if (!hold) throw new Error('আবেদন পাওয়া যায়নি');

    if (hold.studentId !== String(studentId)) {
      const err = new Error('শুধুমাত্র নিজের আবেদন কনফার্ম করা যাবে।');
      err.status = 403;
      throw err;
    }

    if (hold.status === 'CONFIRMED') {
      return { holdId, status: 'CONFIRMED' };
    }

    if (hold.status !== 'HELD') {
      const err = new Error('শুধুমাত্র মেয়াদ না পেরোনো HELD আবেদন কনফার্ম করা যাবে।');
      err.status = 400;
      throw err;
    }

    if (new Date(hold.expiresAt).getTime() <= Date.now()) {
      hold.status = 'EXPIRED';
      saveStoredHolds(holds);
      const err = new Error('আবেদনের মেয়াদ শেষ হয়ে গেছে।');
      err.status = 400;
      throw err;
    }

    hold.status = 'CONFIRMED';
    saveStoredHolds(holds);

    // Update class counters
    const classes = getStoredClasses();
    const cls = classes.find((c) => c.id === hold.classId);
    if (cls) {
      cls.heldSeats = Math.max(0, cls.heldSeats - 1);
      cls.confirmedSeats += 1;
      saveStoredClasses(classes);
    }

    return { holdId: hold.holdId, status: 'CONFIRMED' };
  },

  async cancelHold(holdId, studentId) {
    await new Promise((r) => setTimeout(r, 150));
    const holds = getStoredHolds();
    const hold = holds.find((h) => h.holdId === holdId);
    if (!hold) return { success: true };

    if (hold.studentId !== String(studentId)) {
      const err = new Error('শুধুমাত্র নিজের আবেদন বাতিল করা যাবে।');
      err.status = 403;
      throw err;
    }

    if (hold.status === 'HELD') {
      hold.status = 'CANCELLED';
      saveStoredHolds(holds);

      // Return seat
      const classes = getStoredClasses();
      const cls = classes.find((c) => c.id === hold.classId);
      if (cls) {
        cls.heldSeats = Math.max(0, cls.heldSeats - 1);
        cls.availableSeats = Math.min(cls.totalSeats - cls.confirmedSeats, cls.availableSeats + 1);
        saveStoredClasses(classes);
      }
    } else {
      hold.status = 'CANCELLED';
      saveStoredHolds(holds);
    }

    return { success: true };
  },

  async getMyHolds(studentId) {
    await new Promise((r) => setTimeout(r, 120));
    const holds = getStoredHolds();
    return holds
      .filter((h) => h.studentId === String(studentId))
      .map((h) => ({
        holdId: h.holdId,
        classId: h.classId,
        className: h.className || `Class ${h.classId}`,
        status: h.status,
        expiresAt: h.expiresAt,
      }));
  },
};

