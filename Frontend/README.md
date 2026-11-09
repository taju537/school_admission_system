# School Admission System - Frontend (React + Vite)

Frontend application for the School Admission System take-home assignment by Onnorokom Projukti Limited.

## 🚀 Features Implemented

### 1. Student ID Handling (§1.3 & §1.4)
- **No Login / Registration Required**: Uses the student's 17-digit birth registration number (জন্ম নিবন্ধন নম্বর) as identity.
- **Strict Validation**: Real-time digit validation (exact 17 numeric digits required).
- **Session Persistence**: Stored in `localStorage` so that upon refreshing or reopening the browser, active holds and applications persist.
- **Header Injection**: All student-specific endpoints send the `X-Student-Id` header.
- **Demo Quick-Fill**: 1-click preset button with the assignment sample ID (`20152691234567890`) for rapid testing.

### 2. Parent Dashboard (§1.3 & §1.5)
- **Class Catalog & Real-time Seat Tracking**:
  - Displays Total, Confirmed, Held, and Available seats for every class and shift.
  - Live background auto-polling every 4 seconds without page reload.
  - "আবেদন করুন (Hold Seat)" button with duplicate check and seat availability rules.
- **My Applications (আমার আবেদনসমূহ)**:
  - Fetches `/me/holds` using `X-Student-Id`.
  - **Live Countdown Timer**: Real-time second-by-second countdown with visual progress bar.
  - **Auto-Expiration**: When time runs out, status immediately flips to `EXPIRED` without reloading the page, and the "ভর্তি ফি দিন" button is disabled.
  - **Mock Payment**: Clicking "ভর্তি ফি দিন" confirms admission (`POST /holds/{holdId}/confirm`).
  - **Cancellation**: "আবেদন বাতিল" releases the hold (`DELETE /holds/{holdId}`) and opens up the seat.
- **Direct Hold Lookup**:
  - Direct inquiry tool for testing `GET /holds/{holdId}`.

### 3. Admin Dashboard (§1.3)
- **Create Class & Shift (`POST /classes`)**:
  - Create separate classes for each shift (e.g. `Class 6 - Morning Shift`, `Class 6 - Day Shift`) with total seat count.
  - Quick-preset chips for fast test data creation.
- **Class Analytics & Real-time Monitoring**:
  - Aggregate statistics: Total Classes, Total Seats, Confirmed Admissions, Held Seats, Available Seats.
  - Real-time seat distribution table with visual occupancy bars.

### 4. Robust Error Handling & Bengali Localization (§1.5)
- Friendly Bengali error messages for 409 Conflict, 400 Bad Input, 404 Not Found, and server offline states.
- Dual-mode architecture: Directly communicates with the backend HTTP API (`http://localhost:8080`), with a fallback offline simulation engine for standalone UI testing.

---

## 🛠️ Quick Start

### Development Mode:
```bash
npm install
npm run dev
```

### Production Build:
```bash
npm run build
npm run preview
```

### Automated Tests (Bonus §1.6):
```bash
npm test
```

### Environment Configuration:
Set backend API URL in `.env`:
```env
VITE_API_URL=http://localhost:8080
```
