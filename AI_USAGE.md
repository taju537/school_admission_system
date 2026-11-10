# AI USAGE DISCLOSURE

In accordance with §1.7 of the assignment requirements, this document outlines the usage of AI tools during the development of the School Admission System.

---

## 1. AI Tool Used
- **Antigravity (Google DeepMind)**

---

## 2. Areas Where AI Was Used
1. **Frontend Architecture & Components**:
   - Scaffolding the React 18+ application with Vite.
   - Crafting the Admin Dashboard (`POST /classes`, aggregate metrics, real-time tables) and Parent Portal (`GET /classes`, seat booking, live countdown, mock payment).
   - Implementing student ID handling without login (17-digit birth registration number validation, `localStorage` persistence, and `X-Student-Id` header injection).
   - Real-time client countdown hook (`useCountdown`) and polling hook (`useClassesPolling`).
2. **Backend Architecture & Database Setup**:
   - .NET 8 Web API project structure with Entity Framework Core and Npgsql PostgreSQL provider.
   - Implementing Pessimistic Database Row Locking (`SELECT ... FOR UPDATE`) to guarantee zero seat overselling even across multiple backend instances.
   - Background hosted service for expired holds cleanup.
3. **Automated Tests**:
   - Concurrency testing simulating 30 concurrent applicants competing for 5 seats.
   - Unit tests for 17-digit ID validation and hold lifecycle transitions.

---

## 3. Discrepancies / Mistakes Caught & Corrections Made
1. **Seat Expiration Race Condition**:
   - *Initial AI suggestion*: Relying solely on a periodic background hosted service (timer) to flip expired holds and update available seats.
   - *Issue caught*: If a hold expired at second 10, but the background timer only runs at second 15, there is a 5-second window where the seat remains locked and unavailable to other applicants.
   - *Correction applied*: Implemented **dynamic expiration evaluation** directly in the seat calculation query (`WHERE Status == 'HELD' AND ExpiresAt > DateTime.UtcNow`). The seat is released to `availableSeats` the exact millisecond the timestamp elapses, with the background worker serving solely as an asynchronous DB sweeper.
2. **Multi-Process Concurrency Across Ports (Bonus §1.6)**:
   - *Initial AI suggestion*: Using in-memory `lock` or C# `SemaphoreSlim`.
   - *Issue caught*: In-memory locks only protect within a single process. If two backend instances run on separate ports against the same database, in-memory locks do not prevent race conditions between the two processes.
   - *Correction applied*: Implemented database-level pessimistic locking (`SELECT "Id" FROM "Classes" WHERE "Id" = @id FOR UPDATE`) inside an explicit transaction, serializing requests across any number of backend processes.
3. **Frontend Expiration Without Page Reload**:
   - *Requirement §1.5*: "মেয়াদ শেষ হলে page reload ছাড়াই আবেদন EXPIRED দেখাবে, আর 'ভর্তি ফি দিন' button বন্ধ হবে।"
   - *Correction applied*: Engineered the `useCountdown` hook with a reactive expiration callback that immediately switches the local hold card state to `EXPIRED` upon reaching zero, instantly disabling the payment button without requiring any network refetch or page reload.

