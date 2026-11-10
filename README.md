# 🏫 School Admission System (বিদ্যালয় ভর্তি ব্যবস্থা)

> **Assistant Software Engineer Take-home Assignment**  
> **Onnorokom Projukti Limited**  
> **Stack**: .NET 8 (C#) • PostgreSQL • React 18+ (Vite) • Docker

---

## 📌 Project Overview

An automated, first-come-first-served online school admission management system designed to handle heavy concurrent traffic without lotteries or overselling seats.
- Each shift is treated as an independent class (e.g., `Class 6 - Morning Shift`, `Class 6 - Day Shift`).
- Parents enter the student's **17-digit birth registration number**; no login or password is required.
- Applicants hold a seat for `HOLD_DURATION_SECONDS` (default 600s / 10 minutes).
- Within this time window, submitting admission fees confirms the seat. If unpaid, the seat automatically returns to the pool.
- Full UI for both School Administrators and Parents.

---

## 🚀 How to Run the App with Docker

As specified in §1.2, the entire application runs using Docker. No other software needs to be installed on the host machine.

### 1. Start All Services:
From the root directory of the repository, execute:
```bash
docker-compose up --build
```
*(or `docker compose up --build` depending on your Docker CLI version)*

This single command boots up:
1. **PostgreSQL 16**: Port `5432` with persistent data volume (`pgdata`).
2. **.NET 8 Web API Backend**: Port `8080` (with automatic DB migration & seeding).
3. **React 18+ Frontend**: Port `3000` (served with Nginx).

### 2. Application URLs:
- **Frontend UI**: [http://localhost:3000](http://localhost:3000) *(or http://localhost:5173 when running Vite in local dev mode)*
- **Backend API Base**: [http://localhost:8080](http://localhost:8080)
- **Swagger Documentation**: [http://localhost:8080/swagger](http://localhost:8080/swagger)

### 3. Stopping the App:
```bash
docker-compose down
```
*(All data is safely preserved in the PostgreSQL volume upon subsequent `docker-compose up` calls)*

---

## 🧪 How to Run Automated Tests

### 1. Backend Automated Tests (including Concurrency Test):
The backend test suite includes unit and concurrency tests verifying that concurrent requests never oversell seats:
```bash
dotnet test
```
*Or run inside a temporary .NET SDK Docker container if .NET is not installed locally:*
```bash
docker run --rm -v "%cd%:/src" -w /src mcr.microsoft.com/dotnet/sdk:8.0 dotnet test SchoolAdmission.sln
```

### 2. Frontend Automated Tests (Bonus §1.6):
Runs unit tests for 17-digit ID validation, countdown expiry calculation, and API contract matching:
```bash
cd Frontend
npm test
```

---

## 🏛️ Architecture & Highlights

1. **Exact API Contracts**: Strict compliance with all 8 endpoints and JSON shapes defined in §1.4.
2. **Absolute Concurrency Safety (Bonus §1.6)**: Uses database row-level locking (`SELECT ... FOR UPDATE`) in PostgreSQL inside explicit transactions. Even with multiple backend processes running concurrently on different ports against the same database, seat limits are mathematically guaranteed never to be exceeded.
3. **Dynamic Seat Expiration**: Seats are returned to `availableSeats` the exact millisecond `expiresAt` passes, with no background lag or explicit API trigger required.
4. **Login-Free Identification**: 17-digit birth registration number sent via the `X-Student-Id` header and preserved in `localStorage`.
5. **Real-time UI**: Live ticking countdown timer that automatically disables payment and marks holds as `EXPIRED` without reloading the page. Live background polling updates class seat numbers every few seconds.

---

## 📁 Repository Structure

```
School_admission_system/
├── Backend/                    # .NET 8 Web API
│   ├── Controllers/            # ClassesController, HoldsController, MeController
│   ├── Data/                   # ApplicationDbContext, DbInitializer
│   ├── DTOs/                   # Request & Response Contracts (§1.4)
│   ├── Middleware/             # GlobalExceptionMiddleware (4xx handling)
│   ├── Models/                 # SchoolClass, Hold, HoldStatus
│   ├── Services/               # AdmissionService, HoldExpirationBackgroundService
│   ├── Dockerfile              # Multi-stage .NET 8 build & runtime
│   └── SchoolAdmission.Api.csproj
├── Backend.Tests/              # Automated Backend Tests (xUnit)
│   ├── ClassApiTests.cs
│   ├── HoldLifecycleTests.cs
│   └── ConcurrencyTests.cs     # 30 concurrent applicants competing for 5 seats
├── Frontend/                   # React 18+ Vite Application
│   ├── src/
│   │   ├── components/         # AdminDashboard, ParentDashboard, StudentIdBar, etc.
│   │   ├── context/            # StudentContext, NotificationContext
│   │   ├── hooks/              # useCountdown, useClassesPolling
│   │   ├── services/           # api.js, admissionClient.js, mockApi.js
│   │   └── __tests__/          # Frontend automated tests
│   ├── Dockerfile              # Multi-stage Node.js build & Nginx runtime
│   └── nginx.conf
├── docker-compose.yml          # Root multi-container orchestration
├── SchoolAdmission.sln         # Visual Studio / .NET Solution
├── ASSUMPTIONS.md              # Technical assumptions & concurrency explanation
├── AI_USAGE.md                 # AI usage disclosure per §1.7
└── README.md                   # This file
```
